import { describe, expect, it } from 'vitest';
import { categoryHref, clearFilterParams, priceDraftError } from './catalog-filters';

describe('catalog filter navigation', () => {
  it('keeps the search and chosen order when clearing refinements', () => {
    const current = new URLSearchParams(
      'q=linen&sort=price_asc&brand=local&category=apparel&minPrice=100&maxPrice=900&availability=in_stock&color=Blue&size=M&page=4',
    );
    expect(clearFilterParams(current).toString()).toBe('q=linen&sort=price_asc');
    expect(current.get('brand')).toBe('local');
  });

  it('switches category routes while retaining refinements and resetting pagination', () => {
    const current = new URLSearchParams(
      'brand=local&color=Blue&sort=newest&category=apparel&page=3',
    );
    expect(categoryHref('bags', current)).toBe('/c/bags?brand=local&color=Blue&sort=newest');
    expect(categoryHref('', current)).toBe('/?brand=local&color=Blue&sort=newest');
    expect(current.get('page')).toBe('3');
  });

  it('encodes category names as one path segment', () => {
    expect(categoryHref('أحذية / shoes', new URLSearchParams())).toBe(
      `/c/${encodeURIComponent('أحذية / shoes')}`,
    );
  });
});

describe('price filter validation', () => {
  it.each([
    ['', ''],
    ['0', '0'],
    ['100', ''],
    ['', '250'],
    ['150.50', '150.50'],
  ])('accepts usable bounds %s–%s', (min, max) => {
    expect(priceDraftError(min, max)).toBeUndefined();
  });

  it.each([
    ['-1', '100'],
    ['100', '-1'],
    ['NaN', ''],
    ['', 'Infinity'],
  ])('rejects invalid bounds %s–%s', (min, max) => {
    expect(priceDraftError(min, max)).toBe('nonNegativePrice');
  });

  it("reports reversed bounds without swapping the shopper's input", () => {
    expect(priceDraftError('200', '100')).toBe('invalidRange');
  });
});
