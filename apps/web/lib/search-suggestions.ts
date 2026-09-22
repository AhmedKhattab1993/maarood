import type { BrandSummary } from './api/types';

/** Match shopper text across case, punctuation, and common Arabic spellings. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function matchingBrands(brands: BrandSummary[], query: string): BrandSummary[] {
  const words = normalizeSearchText(query).split(' ').filter(Boolean);
  return brands.filter((brand) => {
    const text = normalizeSearchText(`${brand.name} ${brand.slug} ${brand.domain}`);
    return words.every((word) => text.includes(word));
  });
}

/** Storage may contain an older format, malformed JSON, or entries from an extension. */
export function parseRecentSearches(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .filter((value): value is string => {
        if (typeof value !== 'string' || !value.trim() || value.length > 120) return false;
        const normalized = normalizeSearchText(value);
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .map((value) => value.trim())
      .slice(0, 6);
  } catch {
    return [];
  }
}

export function rememberSearch(recent: string[], query: string): string[] {
  const value = query.trim().slice(0, 120);
  const normalized = normalizeSearchText(value);
  if (!normalized) return recent;
  return [value, ...recent.filter((item) => normalizeSearchText(item) !== normalized)].slice(0, 6);
}
