import type { Availability } from "./api/types";

/**
 * The availability shown to shoppers. Crawler-level "unknown" is common, but
 * variant stock data often carries a real signal — derive from it before
 * falling back to "unknown" so users never see a vague state that contradicts
 * the size table below.
 */
export function displayAvailability(product: {
  availability: Availability;
  variants: { availability: Availability }[];
}): Availability {
  if (product.availability !== "unknown") return product.availability;
  const states = product.variants.map((v) => v.availability);
  if (states.length === 0) return "unknown";
  if (states.every((s) => s === "out_of_stock")) return "out_of_stock";
  if (states.some((s) => s === "in_stock")) return "in_stock";
  return "unknown";
}
