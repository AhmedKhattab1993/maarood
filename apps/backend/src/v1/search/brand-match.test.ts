import { describe, it, expect } from 'vitest';
import { brandMatchesNormalizedQuery } from './brand-match';
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
});
