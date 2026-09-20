/**
 * Decode merchant-imported title/description text: strip tags, unescape a
 * small set of HTML entities, collapse whitespace. Does not rewrite names.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Named entities, apostrophe numeric forms, and &#NNN; / &#xHH;. */
const ENTITY =
  /&(?:amp|lt|gt|quot|apos|nbsp);|&#0?39;?|&#x[0-9a-fA-F]+;|&#\d+;/gi;

function codePointToChar(n: number): string | null {
  if (!Number.isInteger(n) || n <= 0 || n > 0x10ffff) return null;
  if (n >= 0xd800 && n <= 0xdfff) return null;
  return String.fromCodePoint(n);
}

function decodeEntity(full: string): string {
  if (full.startsWith('&#x') || full.startsWith('&#X')) {
    const n = Number.parseInt(full.slice(3, full.endsWith(';') ? -1 : undefined), 16);
    return codePointToChar(n) ?? full;
  }
  if (full.startsWith('&#')) {
    const n = Number.parseInt(full.slice(2, full.endsWith(';') ? -1 : undefined), 10);
    return codePointToChar(n) ?? full;
  }
  const name = full.slice(1, full.endsWith(';') ? -1 : undefined).toLowerCase();
  return NAMED_ENTITIES[name] ?? full;
}

function decodeEntities(input: string): string {
  let current = input;
  for (let i = 0; i < 3; i++) {
    const next = current.replace(ENTITY, decodeEntity);
    if (next === current) break;
    current = next;
  }
  return current;
}

export function decodeImportedText(input: string): string {
  const stripped = input.replace(/<[^>]*>/g, ' ');
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}
