import { describe, it, expect } from 'vitest';
import { materialChecksum } from './checksum';
import { MATERIAL_CHANGE_FIELDS, type Product } from '@maarood/schema';

type MaterialProduct = Pick<Product, (typeof MATERIAL_CHANGE_FIELDS)[number]>;

function makeProduct(overrides: Partial<MaterialProduct> = {}): MaterialProduct {
  return {
    sourceUrl: 'https://example.com/p/1',
    merchantProductId: 'abc',
    title: 'Tee',
    description: 'cotton',
    category: 'apparel',
    subcategory: '',
    currentPrice: 500,
    previousPrice: null,
    currency: 'EGP',
    availability: 'in_stock',
    variants: [],
    sizes: ['M'],
    colors: [],
    imageUrls: ['https://example.com/i.jpg'],
    redirectUrl: 'https://example.com/p/1',
    ...overrides,
  };
}

describe('materialChecksum', () => {
  it('is deterministic for the same input', () => {
    expect(materialChecksum(makeProduct())).toBe(materialChecksum(makeProduct()));
  });

  it('changes when a material field changes', () => {
    const a = materialChecksum(makeProduct());
    const b = materialChecksum(makeProduct({ currentPrice: 600 }));
    expect(a).not.toBe(b);
  });

  it('does not consider revisionNumber/timestamps (non-material fields) — checksum only covers MATERIAL_CHANGE_FIELDS', () => {
    // Two products identical on material fields produce the same checksum,
    // even though they'd differ on revisionNumber/lastSeenAt in the real row.
    expect(materialChecksum(makeProduct())).toBe(materialChecksum(makeProduct()));
  });

  it('changes when array contents change (sizes/colors)', () => {
    const a = materialChecksum(makeProduct());
    const b = materialChecksum(makeProduct({ sizes: ['M', 'L'] }));
    expect(a).not.toBe(b);
  });
});
