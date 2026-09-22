import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { followIntent, saveIntent, toggleVisual } from "./follow-intent";

describe("followIntent", () => {
  it("sends viewers without an auth token to login", () => {
    expect(followIntent(false, false)).toBe("login");
    expect(followIntent(false, true)).toBe("login");
  });

  it("follows when the viewer is signed in and not following", () => {
    expect(followIntent(true, false)).toBe("follow");
  });

  it("unfollows when the viewer is already following", () => {
    expect(followIntent(true, true)).toBe("unfollow");
  });
});

describe("saveIntent", () => {
  it("sends viewers without an auth token to login", () => {
    expect(saveIntent(false, false)).toBe("login");
    expect(saveIntent(false, true)).toBe("login");
  });

  it("toggles save when signed in", () => {
    expect(saveIntent(true, false)).toBe("save");
    expect(saveIntent(true, true)).toBe("unsave");
  });
});

describe("toggleVisual", () => {
  it("lets pending win, then failed, then active/inactive", () => {
    expect(toggleVisual(true, true, false)).toBe("pending");
    expect(toggleVisual(true, true, true)).toBe("pending");
    expect(toggleVisual(true, false, true)).toBe("failed");
    expect(toggleVisual(false, false, true)).toBe("failed");
    expect(toggleVisual(true, false, false)).toBe("active");
    expect(toggleVisual(false, false, false)).toBe("inactive");
  });

  it("never treats failed as active", () => {
    expect(toggleVisual(true, false, true)).not.toBe("active");
    expect(toggleVisual(false, false, true)).not.toBe("active");
  });
});

describe("FollowButton", () => {
  const src = readFileSync(
    new URL("../components/follow-button.tsx", import.meta.url),
    "utf8",
  );

  it("uses followIntent and calls followBrand when not following", () => {
    expect(src).toMatch(/followIntent\(Boolean\(getAuthToken\(\)\), following\)/);
    expect(src).toMatch(/intent === ["']login["']/);
    expect(src).toMatch(/stash\(/);
    expect(src).toMatch(/router\.push\(["']\/login["']\)/);
    expect(src).toMatch(/followBrand\(merchantId\)/);
    expect(src).toMatch(/unfollowBrand\(merchantId\)/);
    expect(src).toMatch(/setFailed\(true\)/);
    expect(src).toMatch(/toggleVisual\(following, pending, failed\)/);
  });
});

describe("SaveButton", () => {
  const src = readFileSync(
    new URL("../components/save-button.tsx", import.meta.url),
    "utf8",
  );

  it("uses saveIntent and stashes before login", () => {
    expect(src).toMatch(/saveIntent\(Boolean\(getAuthToken\(\)\), saved\)/);
    expect(src).toMatch(/stash\(/);
    expect(src).toMatch(/router\.push\(["']\/login["']\)/);
    expect(src).toMatch(/setFailed\(true\)/);
    const catchBlock = src.slice(src.indexOf("} catch (err)"), src.indexOf("const ariaLabel"));
    expect(catchBlock).toMatch(/setFailed\(true\)/);
    expect(catchBlock).not.toMatch(/setSaved\(true\)/);
  });
});
