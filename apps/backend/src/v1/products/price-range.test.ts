import { describe, it, expect } from 'vitest';
import { validatePriceRange } from './price-range';
import { productQuery } from './products.dto';

describe('validatePriceRange', () => {
  it('rejects minPrice greater than maxPrice', () => {
    const result = validatePriceRange(200, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe('minPrice must be less than or equal to maxPrice');
    }
  });

  it('accepts minPrice less than or equal to maxPrice', () => {
    expect(validatePriceRange(10, 100)).toEqual({ ok: true });
    expect(validatePriceRange(50, 50)).toEqual({ ok: true });
  });

  it('accepts a single bound', () => {
    expect(validatePriceRange(10, undefined)).toEqual({ ok: true });
    expect(validatePriceRange(undefined, 100)).toEqual({ ok: true });
  });
});

describe('productQuery price range', () => {
  it('rejects minPrice greater than maxPrice', () => {
    const parsed = productQuery.safeParse({ minPrice: 200, maxPrice: 100 });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.message === 'minPrice must be less than or equal to maxPrice')).toBe(
        true,
      );
    }
  });

  it('accepts minPrice <= maxPrice together with category', () => {
    const parsed = productQuery.parse({ category: 'apparel', minPrice: 10, maxPrice: 100 });
    expect(parsed.category).toBe('apparel');
    expect(parsed.minPrice).toBe(10);
    expect(parsed.maxPrice).toBe(100);
  });
});
