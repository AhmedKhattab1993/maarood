/**
 * Distinct color and size values stored as JSON text arrays on products.
 * Counting is case-insensitive so "Black" and "black" are one choice, while
 * the first spelling seen is what the filter chip shows.
 */

const DEFAULT_LIMIT = 40;

export function parseFacetArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value !== '');
  } catch {
    return [];
  }
}

export function tallyFacetValues(
  raws: Array<string | null | undefined>,
  limit = DEFAULT_LIMIT,
): string[] {
  const counts = new Map<string, { value: string; count: number }>();
  for (const raw of raws) {
    const seen = new Set<string>();
    for (const value of parseFacetArray(raw)) {
      const key = value.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { value, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, limit)
    .map((entry) => entry.value);
}
