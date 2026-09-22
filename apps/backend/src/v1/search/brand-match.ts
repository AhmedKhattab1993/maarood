import { searchTokens } from './normalize';
import { buildSearchTerms } from './synonyms';

function phraseIndex(haystack: readonly string[], needle: readonly string[]): number {
  if (needle.length === 0) return -1;
  return haystack.findIndex((_, index) =>
    needle.every((token, offset) => haystack[index + offset] === token),
  );
}

/** The rest of a query after a complete brand name, or null when no brand is named. */
export function brandProductQuery(name: string, slug: string, query: string): string | null {
  const tokens = searchTokens(query);
  const aliases = [searchTokens(name), searchTokens(slug)].sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const index = phraseIndex(tokens, alias);
    if (index !== -1) return [...tokens.slice(0, index), ...tokens.slice(index + alias.length)].join(' ');
  }
  return null;
}

export function brandMatchesNormalizedQuery(
  name: string,
  slug: string,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return false;
  const tokens = searchTokens(normalizedQuery);
  const wholeWordMatch = phraseIndex(searchTokens(name), tokens) !== -1 ||
    phraseIndex(searchTokens(slug), tokens) !== -1 ||
    brandProductQuery(name, slug, normalizedQuery) !== null;
  if (wholeWordMatch) return true;
  // Brand suggestions can complete the last word being typed, while familiar
  // product words such as "bag" must not suggest unrelated "Baggy" stores.
  if ((tokens.at(-1)?.length ?? 0) < 2 || buildSearchTerms(normalizedQuery).some((term) => term.productType || term.color)) return false;
  return [searchTokens(name), searchTokens(slug)].some((alias) => alias.some((_, index) =>
    tokens.every((token, offset) => offset === tokens.length - 1
      ? alias[index + offset]?.startsWith(token)
      : alias[index + offset] === token),
  ));
}
