/**
 * Whether to show a strikethrough / percent-off, and the rounded percent.
 * Only when a previous price exists and is strictly greater than the current price.
 */
export function priceDiscount(
  current: number,
  previous: number | null,
): { show: false } | { show: true; percent: number } {
  if (previous === null || previous <= current) return { show: false };
  return { show: true, percent: Math.round((1 - current / previous) * 100) };
}
