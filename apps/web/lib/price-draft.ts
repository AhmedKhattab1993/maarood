/**
 * Price filters commit when the shopper leaves the field or closes the
 * drawer — not on each keystroke. Returns null when the query would not change.
 */
export function nextPriceParams(
  current: URLSearchParams,
  min: string,
  max: string,
): URLSearchParams | null {
  const params = new URLSearchParams(current.toString());
  const nextMin = min.trim();
  const nextMax = max.trim();
  if (nextMin) params.set("minPrice", nextMin);
  else params.delete("minPrice");
  if (nextMax) params.set("maxPrice", nextMax);
  else params.delete("maxPrice");
  if (params.toString() === current.toString()) return null;
  return params;
}
