import { describe, it, expect } from 'vitest';
import { productQuery } from './products.dto';

describe('productQuery merchantId', () => {
  it('accepts a comma-separated list of merchant UUIDs for the Following feed', () => {
    const a = '11111111-1111-4111-8111-111111111111';
    const b = '22222222-2222-4222-8222-222222222222';
    const parsed = productQuery.parse({ merchantId: `${a},${b}`, sort: 'newest' });
    expect(parsed.merchantId).toEqual([a, b]);
  });

  it('accepts a repeated merchantId array', () => {
    const a = '11111111-1111-4111-8111-111111111111';
    const parsed = productQuery.parse({ merchantId: [a], sort: 'newest' });
    expect(parsed.merchantId).toEqual([a]);
  });
});
