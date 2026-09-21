import { describe, it, expect } from 'vitest';
import { productIdParam } from './products.dto';

describe('productIdParam', () => {
  it('accepts a UUID', () => {
    expect(productIdParam.safeParse('bec07241-945a-41f4-982a-0cda28177c48').success).toBe(true);
  });

  it('accepts a UUID with surrounding whitespace', () => {
    expect(productIdParam.safeParse(' bec07241-945a-41f4-982a-0cda28177c48 ').success).toBe(true);
  });

  it('rejects arbitrary strings', () => {
    expect(productIdParam.safeParse('does-not-exist').success).toBe(false);
    expect(productIdParam.safeParse('').success).toBe(false);
  });
});
