/**
 * MVP Arabic + English search normalization.
 *
 * - Lowercase, collapse whitespace.
 * - Strip Arabic diacritics (tashkeel) and tatweel.
 * - Normalize Arabic letter variants that don't affect meaning:
 *   Alef (أ إ آ → ا), Ya/Alef-Maqsura (ى → ي), Ta-Marbuta (ة → ه).
 *
 * The same normalization is applied to the user query; the indexed
 * search_vector uses Postgres 'simple' tokenization, so we keep the query
 * as plain OR'd terms. This is deliberately simple — refinable later.
 */

const ARABIC_DIACRITICS = /[\u0617-\u061A\u064B-\u0652\u0670\u0640]/g;

export function normalizeSearchQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a Postgres tsquery string from a normalized free-text query.
 * Terms are OR'd so any match surfaces; ranking is handled by ts_rank.
 * Empty terms are dropped to avoid empty-query errors.
 */
export function toTsqueryString(normalized: string): string {
  const terms = normalized
    .split(' ')
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((t) => t.length > 0);
  return terms.join(' | ');
}
