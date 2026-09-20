import { describe, it, expect } from 'vitest';
import { AVAILABILITY_FRESHNESS_MS } from './availability';
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
    availabilityCheckedAt: null,
    vendor: '',
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

  it('decodes HTML entities in title, description, and vendor', () => {
    const p = mapProduct(
      row({
        title: "Women&#39;s Cotton Tee",
        description: 'Pants &amp; Denim',
        vendor: 'Foo &amp; Bar',
      }),
    );
    expect(p.title).toBe("Women's Cotton Tee");
    expect(p.description).toBe('Pants & Denim');
    expect(p.vendor).toBe('Foo & Bar');
  });

  it('resolves availability from freshness and exposes availabilityCheckedAt', () => {
    const checkedAt = new Date();
    const p = mapProduct(
      row({
        availability: 'out_of_stock',
        availabilityCheckedAt: checkedAt,
      }),
    );
    expect(p.availability).toBe('out_of_stock');
    expect(p.availabilityCheckedAt).toBe(checkedAt.toISOString());
  });

  it('does not treat missing or stale availability as in_stock', () => {
    expect(mapProduct(row({ availability: 'in_stock', availabilityCheckedAt: null })).availability).toBe(
      'unknown',
    );
    const stale = new Date(Date.now() - AVAILABILITY_FRESHNESS_MS - 1000);
    expect(
      mapProduct(row({ availability: 'in_stock', availabilityCheckedAt: stale })).availability,
    ).toBe('unknown');
    expect(
      mapProduct(row({ availability: 'unknown', availabilityCheckedAt: new Date() })).availability,
    ).toBe('unknown');
  });
});
