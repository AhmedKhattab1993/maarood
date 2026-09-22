import { describe, expect, it } from 'vitest';
import {
  matchingBrands,
  normalizeSearchText,
  parseRecentSearches,
  rememberSearch,
} from './search-suggestions';
import type { BrandSummary } from './api/types';

const brands: BrandSummary[] = [
  {
    id: '1',
    name: 'Nile Studio',
    slug: 'nile-studio',
    domain: 'nile.shop',
    productCount: 12,
    logoUrl: null,
  },
  { id: '2', name: 'أُنس', slug: 'ons', domain: 'ons.example', productCount: 5, logoUrl: null },
];

describe('brand discovery matching', () => {
  it('matches Arabic diacritics and alef variants, and searches brand domains', () => {
    expect(normalizeSearchText('أُنس')).toBe('انس');
    expect(matchingBrands(brands, 'انس')).toEqual([brands[1]]);
    expect(matchingBrands(brands, 'NILE.shop')).toEqual([brands[0]]);
  });

  it('requires every query word without depending on word order', () => {
    expect(matchingBrands(brands, 'studio nile')).toEqual([brands[0]]);
    expect(matchingBrands(brands, 'nile absent')).toEqual([]);
    expect(matchingBrands(brands, '')).toEqual(brands);
  });
});

describe('recent search storage', () => {
  it('discards invalid formats and normalizes duplicated entries', () => {
    expect(parseRecentSearches('not json')).toEqual([]);
    expect(parseRecentSearches('{"query":"shoes"}')).toEqual([]);
    expect(
      parseRecentSearches(
        JSON.stringify([null, 4, '', 'Shoes', ' shoes ', '   BAGS  ', '!', 'x'.repeat(121)]),
      ),
    ).toEqual(['Shoes', 'BAGS']);
  });

  it('moves a repeated query to the front and bounds the history', () => {
    expect(rememberSearch(['bags', 'shoes', 'tops'], ' Shoes ')).toEqual(['Shoes', 'bags', 'tops']);
    expect(rememberSearch(['a', 'b', 'c', 'd', 'e', 'f'], 'g')).toEqual([
      'g',
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
    expect(rememberSearch(['bags'], ' ')).toEqual(['bags']);
  });
});
