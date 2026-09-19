import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { followIntent } from "./follow-intent";

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

describe("FollowButton", () => {
  const src = readFileSync(
    new URL("../components/follow-button.tsx", import.meta.url),
    "utf8",
  );

  it("uses followIntent and calls followBrand when not following", () => {
    expect(src).toMatch(/followIntent\(Boolean\(getAuthToken\(\)\), following\)/);
    expect(src).toMatch(/intent === "login"/);
    expect(src).toMatch(/router\.push\("\/login"\)/);
    expect(src).toMatch(/followBrand\(merchantId\)/);
    expect(src).toMatch(/unfollowBrand\(merchantId\)/);
  });
});
