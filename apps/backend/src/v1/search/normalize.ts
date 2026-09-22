/**
 * MVP Arabic + English search normalization.
 *
 * - Lowercase, collapse whitespace.
 * - Strip Arabic diacritics (tashkeel) and tatweel.
 * - Normalize Arabic letter variants that don't affect meaning:
 *   Alef (أ إ آ → ا), Ya/Alef-Maqsura (ى → ي), Ta-Marbuta (ة → ه).
 *
 * The same letter folding is applied to searchable titles and colors.
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

/** Punctuation separates words; keep the common two-word shirt spellings together. */
export function searchTokens(input: string): string[] {
  return normalizeSearchQuery(input)
    .replace(/\bt[\s-]+shirts?\b/g, 'tshirt')
    .replace(/تي\s+شيرت/g, 'تيشيرت')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
