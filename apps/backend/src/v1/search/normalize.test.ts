import { describe, it, expect } from 'vitest';
import { normalizeSearchQuery, toTsqueryString } from './normalize';

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

describe('toTsqueryString', () => {
  it('joins terms with OR', () => {
    expect(toTsqueryString('black tee')).toBe('black | tee');
  });

  it('drops empty/non-word tokens', () => {
    expect(toTsqueryString('!!  --')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(toTsqueryString('')).toBe('');
  });
});
