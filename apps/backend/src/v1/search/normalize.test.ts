import { describe, it, expect } from 'vitest';
import { normalizeSearchQuery, searchTokens } from './normalize';

describe('normalizeSearchQuery', () => {
  it('lowercases and trims', () => {
    expect(normalizeSearchQuery('  TEE  ')).toBe('tee');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeSearchQuery('black   tee')).toBe('black tee');
  });

  it('strips Arabic diacritics (tashkeel) and tatweel', () => {
    expect(normalizeSearchQuery('قَمِيصٌ')).toBe('قميص');
  });

  it('normalizes Alef variants', () => {
    expect(normalizeSearchQuery('أحمد')).toBe('احمد');
    expect(normalizeSearchQuery('إبراهيم')).toBe('ابراهيم');
    // آ → ا, ة → ه
    expect(normalizeSearchQuery('آمنة')).toBe('امنه');
  });

  it('normalizes Alef-Maqsura to Ya', () => {
    expect(normalizeSearchQuery('على')).toBe('علي');
  });

  it('normalizes Ta-Marbuta to Ha', () => {
    expect(normalizeSearchQuery('بلوزه')).toMatch(/ه$/);
  });
});

describe('searchTokens', () => {
  it('preserves separate query intents', () => {
    expect(searchTokens('black tee')).toEqual(['black', 'tee']);
  });

  it('drops empty/non-word tokens', () => {
    expect(searchTokens('!!  --')).toEqual([]);
  });

  it('returns empty string for empty input', () => {
    expect(searchTokens('')).toEqual([]);
  });

  it('separates punctuation safely and preserves shirt spellings', () => {
    expect(searchTokens('black,shoes')).toEqual(['black', 'shoes']);
    expect(searchTokens('T-shirt / تي شيرت')).toEqual(['tshirt', 'تيشيرت']);
    expect(searchTokens("red');drop table products;--")).toEqual(['red', 'drop', 'table', 'products']);
  });
});
