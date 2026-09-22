import { describe, it, expect } from 'vitest';
import { brandMatchesNormalizedQuery, brandProductQuery } from './brand-match';
import { normalizeSearchQuery } from './normalize';

describe('brandMatchesNormalizedQuery', () => {
  it('matches a brand name or slug against the normalized query', () => {
    const q = normalizeSearchQuery('Zara');
    expect(brandMatchesNormalizedQuery('Zara', 'zara', q)).toBe(true);
    expect(brandMatchesNormalizedQuery('ZARA Downtown', 'zara-downtown', q)).toBe(true);
  });

  it('matches hyphenated slugs after converting hyphens to spaces', () => {
    const q = normalizeSearchQuery('off white');
    expect(brandMatchesNormalizedQuery('Off-White', 'off-white', q)).toBe(true);
  });

  it('distinguishes different brand names', () => {
    const q = normalizeSearchQuery('adidas');
    expect(brandMatchesNormalizedQuery('Zara', 'zara', q)).toBe(false);
    expect(brandMatchesNormalizedQuery('Nike', 'nike', q)).toBe(false);
    expect(brandMatchesNormalizedQuery('Adidas Originals', 'adidas-originals', q)).toBe(true);
  });

  it('does not match an empty query', () => {
    expect(brandMatchesNormalizedQuery('Zara', 'zara', '')).toBe(false);
  });

  it('uses whole words so a short word is not an unrelated brand', () => {
    expect(brandMatchesNormalizedQuery('Baggy Studio', 'baggy-studio', 'bag')).toBe(false);
    expect(brandMatchesNormalizedQuery('Off-White', 'off-white', 'off-white')).toBe(true);
  });

  it('recognizes brand-only and brand-plus-product searches', () => {
    expect(brandProductQuery('Off-White', 'off-white', 'off white')).toBe('');
    expect(brandProductQuery('Off-White', 'off-white', 'black off white shoes')).toBe('black shoes');
    expect(brandProductQuery('Zara', 'zara', 'red shoes')).toBeNull();
    expect(brandMatchesNormalizedQuery('Zara', 'zara', 'zara red shoes')).toBe(true);
  });

  it('completes brand names as shoppers type without turning a prefix into product intent', () => {
    expect(brandMatchesNormalizedQuery('Zara', 'zara', 'zar')).toBe(true);
    expect(brandMatchesNormalizedQuery('Y Studios', 'y-studios', 'y stud')).toBe(true);
    expect(brandProductQuery('Zara', 'zara', 'zar')).toBeNull();
  });
});
