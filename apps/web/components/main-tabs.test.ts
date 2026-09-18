import { describe, it, expect } from "vitest";
import { MAIN_TABS, mainTabIdForPath } from "./main-tabs";

describe("MAIN_TABS", () => {
  it("is Following | Explore | Favourites with no category routes", () => {
    expect(MAIN_TABS.map((t) => t.id)).toEqual(["following", "explore", "favourites"]);
    expect(MAIN_TABS.map((t) => t.pathname)).toEqual(["/following", "/", "/favourites"]);
    expect(MAIN_TABS.some((t) => t.pathname.includes("/c/"))).toBe(false);
  });

  it("maps paths to the three tabs", () => {
    expect(mainTabIdForPath("/")).toBe("explore");
    expect(mainTabIdForPath("/following")).toBe("following");
    expect(mainTabIdForPath("/favourites")).toBe("favourites");
    expect(mainTabIdForPath("/c/apparel")).toBeNull();
  });
});
