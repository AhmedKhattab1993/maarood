import { describe, it, expect } from 'vitest';
import { productSchema } from './product.schema';

const validBase = {
  merchantId: '00000000-0000-0000-0000-000000000001',
  sourceUrl: 'https://example.com/products/1',
  merchantProductId: 'abc-1',
  title: 'Test Tee',
  currentPrice: 500,
  currency: 'EGP',
  lastSeenAt: new Date('2026-01-01'),
};

describe('productSchema', () => {
  it('parses a valid product with defaults applied', () => {
    const parsed = productSchema.parse(validBase);
    expect(parsed.title).toBe('Test Tee');
    expect(parsed.description).toBe('');
    expect(parsed.availability).toBe('unknown');
    expect(parsed.variants).toEqual([]);
    expect(parsed.previousPrice).toBeNull();
    expect(parsed.staleAt).toBeNull();
    expect(parsed.revisionNumber).toBe(1);
  });

  it('rejects an invalid URL', () => {
    expect(() => productSchema.parse({ ...validBase, sourceUrl: 'not-a-url' })).toThrow();
  });

  it('rejects a negative price', () => {
    expect(() => productSchema.parse({ ...validBase, currentPrice: -1 })).toThrow();
  });

  it('rejects a non-3-letter currency', () => {
    expect(() => productSchema.parse({ ...validBase, currency: 'EG' })).toThrow();
    expect(() => productSchema.parse({ ...validBase, currency: 'egypt' })).toThrow();
  });

  it('normalizes currency to uppercase', () => {
    expect(productSchema.parse({ ...validBase, currency: 'egp' }).currency).toBe('EGP');
  });

  it('rejects an invalid availability', () => {
    expect(() =>
      productSchema.parse({ ...validBase, availability: 'discontinued' }),
    ).toThrow();
  });
});
