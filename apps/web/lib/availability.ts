import type { Availability } from "./api/types";

/**
 * The availability shown to shoppers. If any size is in stock, say so — do
 * not also report the product as unconfirmed or out of stock. If every size
 * is out, say out of stock. An explicit product-level out-of-stock still
 * wins when no size is in stock.
 */
export function displayAvailability(product: {
  availability: Availability;
  variants: { availability: Availability }[];
}): Availability {
  const states = product.variants.map((variant) => variant.availability);
  if (states.some((state) => state === "in_stock")) return "in_stock";
  if (product.availability === "out_of_stock") return "out_of_stock";
  if (states.length > 0 && states.every((state) => state === "out_of_stock")) {
    return "out_of_stock";
  }
  if (product.availability === "in_stock") return "in_stock";
  return "unknown";
}
