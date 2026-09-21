/**
 * Cross-language shopping-term synonyms (Arabic ↔ English).
 *
 * The catalog is mostly English-titled while shoppers search in Arabic, so a
 * raw text match under-detects ("شنطه" vs titles saying "bag"). Tokens in the
 * user query are expanded with their group's other languages before matching.
 *
 * All Arabic entries are stored in the shape produced by normalizeSearchQuery
 * (أإآ→ا, ى→ي, ة→ه, diacritics stripped) so lookups are exact string compares.
 */

const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['bag', 'bags', 'handbag', 'backpack', 'wallet', 'شنطه', 'شنط', 'حقيبه', 'حقائب', 'محفظ'],
  ['shoe', 'shoes', 'sneaker', 'sneakers', 'sandal', 'sandals', 'boots', 'حذاء', 'احذيه', 'صندل'],
  ['dress', 'dresses', 'فستان', 'فساتين'],
  ['shirt', 't-shirt', 'tshirt', 'tee', 'تيشيرت', 'قميص', 'قمصان', 'بلوزه'],
  ['pants', 'trousers', 'jeans', 'joggers', 'leggings', 'بنطلون', 'بنطال', 'جينز', 'ليقنز'],
  ['jacket', 'coat', 'hoodie', 'cardigan', 'جاكيت', 'جاكت', 'هودي', 'معطف', 'كارديجان'],
  ['watch', 'ساعه', 'ساعات'],
  ['necklace', 'ring', 'bracelet', 'earrings', 'jewelry', 'عقد', 'خاتم', 'اسوره', 'حلق', 'اقراط', 'اكسسوار'],
  ['perfume', 'fragrance', 'عطر', 'برفان'],
  ['scarf', 'scarves', 'وشاح', 'اوشحه'],
  ['hijab', 'طرحه', 'حجاب'],
  ['gym', 'fitness', 'sport', 'swim', 'رياضه', 'رياضيه', 'رياضي', 'جيم', 'سباحه'],
] as const;

/** term (normalized) → group containing it. */
const TERM_INDEX = new Map<string, readonly string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const term of group) TERM_INDEX.set(term.toLowerCase(), group);
}

/**
 * Other terms interchangeable with the query's tokens.
 * Input may be raw text; it is normalized the same way as the search pipeline.
 * Returns unique terms in group order, excluding the query tokens themselves.
 */
export function expandSynonyms(normalizedQuery: string): string[] {
  const tokens = normalizedQuery
    .split(' ')
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((t) => t.length > 0);
  const hits = new Set<readonly string[]>();
  for (const token of tokens) {
    const group = TERM_INDEX.get(token.toLowerCase());
    if (group) hits.add(group);
  }
  const queryTerms = new Set(tokens.map((t) => t.toLowerCase()));
  const expanded: string[] = [];
  for (const group of hits) {
    for (const term of group) {
      if (!queryTerms.has(term) && !expanded.includes(term)) expanded.push(term);
    }
  }
  return expanded;
}
