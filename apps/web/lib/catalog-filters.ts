export const CATALOG_FILTER_KEYS = [
  'brand',
  'category',
  'minPrice',
  'maxPrice',
  'availability',
  'color',
  'size',
] as const;

/** Clearing refinements keeps the shopper's search and sorting preference. */
export function clearFilterParams(current: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(current.toString());
  for (const key of CATALOG_FILTER_KEYS) params.delete(key);
  params.delete('page');
  return params;
}

/** Category routes carry the category in the path, never in both path and query. */
export function categoryHref(value: string, current: URLSearchParams): string {
  const params = new URLSearchParams(current.toString());
  params.delete('category');
  params.delete('page');
  const path = value ? `/c/${encodeURIComponent(value)}` : '/';
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function priceDraftError(
  min: string,
  max: string,
): 'nonNegativePrice' | 'invalidRange' | undefined {
  const bounds = [min, max].map((value) => value.trim());
  if (
    bounds.some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))
  ) {
    return 'nonNegativePrice';
  }
  if (bounds[0] !== '' && bounds[1] !== '' && Number(bounds[0]) > Number(bounds[1])) {
    return 'invalidRange';
  }
  return undefined;
}
