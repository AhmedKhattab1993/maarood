import { describe, it, expect } from 'vitest';
import { mapProduct } from './product-mapper';

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'p1',
    merchantId: 'm1',
    sourceUrl: 'https://example.com/p',
    merchantProductId: 'abc',
    title: 'Tee',
    description: 'cotton',
    category: 'apparel',
    subcategory: '',
    currentPrice: '500.00',
    previousPrice: '650.00',
    currency: 'EGP',
    availability: 'in_stock',
    variants: '[{"label":"M","availability":"in_stock"}]',
    sizes: '["M","L"]',
    colors: '["black"]',
    imageUrls: '["https://example.com/i.jpg"]',
    redirectUrl: 'https://example.com/p',
    revisionNumber: 1,
    staleAt: null,
    lastSeenAt: '2026-01-01',
    lastUpdatedAt: '2026-01-02',
    ...overrides,
  };
}

describe('mapProduct', () => {
  it('parses JSON-text columns into arrays/objects', () => {
    const p = mapProduct(row());
    expect(p.sizes).toEqual(['M', 'L']);
    expect(p.colors).toEqual(['black']);
    expect(p.imageUrls).toEqual(['https://example.com/i.jpg']);
    expect(p.variants).toEqual([{ label: 'M', availability: 'in_stock' }]);
  });

  it('converts numeric price strings to numbers', () => {
    const p = mapProduct(row());
    expect(p.currentPrice).toBe(500);
    expect(p.previousPrice).toBe(650);
  });

  it('treats null previousPrice as null', () => {
    const p = mapProduct(row({ previousPrice: null }));
    expect(p.previousPrice).toBeNull();
  });

  it('reports stale=true when staleAt is set', () => {
    const p = mapProduct(row({ staleAt: '2026-01-03' }));
    expect(p.stale).toBe(true);
  });

  it('reports stale=false when staleAt is null', () => {
    expect(mapProduct(row()).stale).toBe(false);
  });

  it('returns empty arrays for malformed JSON columns (never throws)', () => {
    const p = mapProduct(row({ sizes: 'not-json', colors: '[broken' }));
    expect(p.sizes).toEqual([]);
    expect(p.colors).toEqual([]);
  });

  it('returns empty arrays when JSON column is not a string', () => {
    const p = mapProduct(row({ variants: null }));
    expect(p.variants).toEqual([]);
  });

  it('returns imageUrls from JSON-text columns', () => {
    const p = mapProduct(
      row({ imageUrls: '["https://cdn.shopify.com/s/files/1/x.jpg"]' }),
    );
    expect(p.imageUrls).toEqual(['https://cdn.shopify.com/s/files/1/x.jpg']);
    expect(p.imageUrls[0]).toMatch(/^https?:\/\//);
  });

  it('returns imageUrls when the driver already parsed the JSON array', () => {
    const p = mapProduct(
      row({
        imageUrls: [
          'https://mobaco.com/wp-content/uploads/a.jpg',
          'https://cdn.shopify.com/s/files/1/y.jpg',
        ],
      }),
    );
    expect(p.imageUrls).toEqual([
      'https://mobaco.com/wp-content/uploads/a.jpg',
      'https://cdn.shopify.com/s/files/1/y.jpg',
    ]);
  });

  it('drops non-http image entries instead of emitting an empty cover', () => {
    const p = mapProduct(
      row({
        imageUrls: ['/relative.jpg', '', 'https://cdn.shopify.com/s/files/1/z.jpg'],
      }),
    );
    expect(p.imageUrls).toEqual(['https://cdn.shopify.com/s/files/1/z.jpg']);
  });
});
