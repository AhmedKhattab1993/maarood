import { describe, expect, it } from "vitest";
import { nextPriceParams } from "./price-draft";

describe("nextPriceParams", () => {
  it("returns null when the draft matches the current query", () => {
    const current = new URLSearchParams("minPrice=100&maxPrice=500");
    expect(nextPriceParams(current, "100", "500")).toBeNull();
    expect(nextPriceParams(current, " 100 ", "500")).toBeNull();
  });

  it("sets and clears both ends in one query", () => {
    const current = new URLSearchParams("category=apparel&minPrice=10");
    const next = nextPriceParams(current, "", "800");
    expect(next?.toString()).toBe("category=apparel&maxPrice=800");
  });
});
