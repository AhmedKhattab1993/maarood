import { describe, expect, it } from "vitest";
import { mergePriceParams } from "./query";

describe("mergePriceParams", () => {
  it("writes both bounds in one commit", () => {
    const out = mergePriceParams(new URLSearchParams("category=apparel"), "100", "500");
    expect(out.get("minPrice")).toBe("100");
    expect(out.get("maxPrice")).toBe("500");
    expect(out.get("category")).toBe("apparel");
  });

  it("removes a bound when its field is blank", () => {
    const out = mergePriceParams(new URLSearchParams("minPrice=100&maxPrice=500"), "100", "");
    expect(out.get("minPrice")).toBe("100");
    expect(out.has("maxPrice")).toBe(false);
  });

  it("trims whitespace around values", () => {
    const out = mergePriceParams(new URLSearchParams(), " 250 ", " ");
    expect(out.get("minPrice")).toBe("250");
    expect(out.has("maxPrice")).toBe(false);
  });

  it("does not mutate the input params", () => {
    const input = new URLSearchParams("minPrice=1");
    mergePriceParams(input, "100", "500");
    expect(input.get("minPrice")).toBe("1");
  });
});
