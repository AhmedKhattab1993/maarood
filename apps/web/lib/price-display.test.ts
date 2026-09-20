import { describe, expect, it } from "vitest";
import { priceDiscount } from "./price-display";

describe("priceDiscount", () => {
  it("shows a rounded percent only when previous is greater than current", () => {
    expect(priceDiscount(80, 100)).toEqual({ show: true, percent: 20 });
    expect(priceDiscount(33, 100)).toEqual({ show: true, percent: 67 });
  });

  it("does not show when previous is missing, equal, or lower", () => {
    expect(priceDiscount(100, null)).toEqual({ show: false });
    expect(priceDiscount(100, 100)).toEqual({ show: false });
    expect(priceDiscount(120, 100)).toEqual({ show: false });
  });
});
