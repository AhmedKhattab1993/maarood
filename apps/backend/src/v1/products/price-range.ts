export function validatePriceRange(
  min?: number,
  max?: number,
): { ok: true } | { ok: false; message: string } {
  if (min !== undefined && max !== undefined && min > max) {
    return { ok: false, message: 'minPrice must be less than or equal to maxPrice' };
  }
  return { ok: true };
}
