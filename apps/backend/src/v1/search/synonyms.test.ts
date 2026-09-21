import { describe, it, expect } from 'vitest';
import { expandSynonyms } from './synonyms';
import { normalizeSearchQuery } from './normalize';

describe('expandSynonyms', () => {
  it('expands an Arabic bag query to English bag terms', () => {
    const out = expandSynonyms(normalizeSearchQuery('شنطة'));
    expect(out).toContain('bag');
    expect(out).toContain('handbag');
    expect(out).toContain('حقيبه');
  });

  it('expands an English query to Arabic terms', () => {
    const out = expandSynonyms(normalizeSearchQuery('shoes'));
    expect(out).toContain('حذاء');
    expect(out).toContain('احذيه');
  });

  it('expands every token of a multi-term query', () => {
    const out = expandSynonyms(normalizeSearchQuery('شنطة رياضية'));
    expect(out).toContain('bag');
    expect(out).toContain('sport');
    expect(out).toContain('gym');
  });

  it('returns only terms the query does not already contain', () => {
    const out = expandSynonyms(normalizeSearchQuery('bag'));
    expect(out).not.toContain('bag');
    expect(out).toContain('شنطه');
  });

  it('returns empty for words with no synonyms', () => {
    expect(expandSynonyms(normalizeSearchQuery('قهوة'))).toEqual([]);
  });

  it('returns empty for an empty query', () => {
    expect(expandSynonyms('')).toEqual([]);
  });

  it('never duplicates a term across matched groups', () => {
    const out = expandSynonyms(normalizeSearchQuery('شنطة bag'));
    expect(new Set(out).size).toBe(out.length);
    expect(out).not.toContain('شنطه');
    expect(out).not.toContain('bag');
  });
});
