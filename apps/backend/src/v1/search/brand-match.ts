import { normalizeSearchQuery } from './normalize';

export function brandMatchesNormalizedQuery(
  name: string,
  slug: string,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return false;
  const normalizedName = normalizeSearchQuery(name);
  const normalizedSlug = normalizeSearchQuery(slug.replace(/-/g, ' '));
  return (
    normalizedName === normalizedQuery ||
    normalizedSlug === normalizedQuery ||
    normalizedName.includes(normalizedQuery) ||
    normalizedSlug.includes(normalizedQuery)
  );
}
