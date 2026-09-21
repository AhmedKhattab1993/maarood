import { describe, expect, it } from "vitest";
import { displayAvailability } from "./availability";

function product(
  availability: "in_stock" | "out_of_stock" | "unknown",
  variants: ("in_stock" | "out_of_stock" | "unknown")[],
) {
  return { availability, variants: variants.map((availability_) => ({ availability: availability_ })) };
}

describe("displayAvailability", () => {
  it("keeps confirmed product-level states as-is", () => {
    expect(displayAvailability(product("in_stock", ["out_of_stock"]))).toBe("in_stock");
    expect(displayAvailability(product("out_of_stock", ["in_stock"]))).toBe("out_of_stock");
  });

  it("derives in-stock from any in-stock variant when the product is unknown", () => {
    expect(displayAvailability(product("unknown", ["in_stock", "unknown"]))).toBe("in_stock");
  });

  it("derives out-of-stock only when every variant is out", () => {
    expect(displayAvailability(product("unknown", ["out_of_stock", "out_of_stock"]))).toBe("out_of_stock");
    expect(displayAvailability(product("unknown", ["out_of_stock", "unknown"]))).toBe("unknown");
  });

  it("stays unknown without variant signal", () => {
    expect(displayAvailability(product("unknown", []))).toBe("unknown");
    expect(displayAvailability(product("unknown", ["unknown"]))).toBe("unknown");
  });
});
