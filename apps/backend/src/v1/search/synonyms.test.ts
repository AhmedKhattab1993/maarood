import { describe, it, expect } from 'vitest';
import { buildSearchTerms } from './synonyms';

describe('buildSearchTerms', () => {
  it('expands an Arabic bag query to equivalent English and Arabic terms', () => {
    const terms = buildSearchTerms('شنطة');
    expect(terms).toHaveLength(1);
    expect(terms[0]?.alternatives).toEqual(expect.arrayContaining(['bag', 'handbag', 'حقيبه', 'شنطه']));
  });

  it('expands an English query to Arabic terms', () => {
    expect(buildSearchTerms('shoes')[0]?.alternatives).toEqual(expect.arrayContaining(['حذاء', 'احذيه']));
  });

  it('expands multiple concepts independently', () => {
    const terms = buildSearchTerms('شنطة رياضية');
    expect(terms).toHaveLength(2);
    expect(terms[0]?.alternatives).toContain('bag');
    expect(terms[1]?.alternatives).toEqual(expect.arrayContaining(['sport', 'gym']));
    expect(terms[0]?.alternatives).not.toContain('sport');
  });

  it('retains an unfamiliar word as its own required term', () => {
    expect(buildSearchTerms('قهوة')).toEqual([
      { token: 'قهوه', alternatives: ['قهوه'], color: false, productType: false },
    ]);
  });

  it('returns no terms for an empty or punctuation-only query', () => {
    expect(buildSearchTerms('')).toEqual([]);
    expect(buildSearchTerms('!!')).toEqual([]);
  });

  it('keeps color and product type as independent required intents', () => {
    const [color, product] = buildSearchTerms('red shoes');
    expect(color).toMatchObject({ token: 'red', color: true, productType: false });
    expect(color?.alternatives).toContain('احمر');
    expect(product).toMatchObject({ token: 'shoes', color: false, productType: true });
    expect(product?.alternatives).toContain('حذاء');
    expect(product?.alternatives).not.toContain('red');
  });

  it('normalizes definite articles and diacritics in Arabic combinations', () => {
    const terms = buildSearchTerms('الحِذَاء الأَحْمَر');
    expect(terms.map((term) => term.token)).toEqual(['حذاء', 'احمر']);
    expect(terms[0]?.alternatives).toContain('shoes');
    expect(terms[1]?.alternatives).toContain('red');
  });

  it('keeps distinct garments separate instead of widening hoodie to any outerwear', () => {
    expect(buildSearchTerms('hoodie')[0]?.alternatives).not.toContain('jacket');
    expect(buildSearchTerms('hoodie')[0]?.alternatives).not.toContain('cardigan');
    expect(buildSearchTerms('ring')[0]?.alternatives).not.toContain('necklace');
  });

  it('deduplicates translated intent and ignores natural-language connector words', () => {
    expect(buildSearchTerms('the red احمر shoes')).toHaveLength(2);
    expect(buildSearchTerms('bag شنطة')).toHaveLength(1);
  });
});
