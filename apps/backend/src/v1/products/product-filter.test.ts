import { describe, it, expect } from 'vitest';
import { productQuery } from './products.dto';
import { buildFilters, shouldExcludeConfirmedOutOfStock, sortSql } from './product-filter';

function collectSql(value: unknown, parts: string[]): void {
  if (value == null) return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    parts.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectSql(item, parts);
    return;
  }
  if (typeof value !== 'object') return;
  if ('queryChunks' in value && Array.isArray((value as { queryChunks: unknown[] }).queryChunks)) {
    for (const chunk of (value as { queryChunks: unknown[] }).queryChunks) collectSql(chunk, parts);
    return;
  }
  if ('name' in value) {
    parts.push(String((value as { name: string }).name));
    return;
  }
  if ('value' in value) {
    collectSql((value as { value: unknown }).value, parts);
  }
}

function sqlText(fragments: ReturnType<typeof sortSql> | ReturnType<typeof buildFilters>): string {
  const parts: string[] = [];
  if (Array.isArray(fragments)) {
    for (const fragment of fragments) collectSql(fragment, parts);
  } else {
    collectSql(fragments, parts);
  }
  return parts.join(' ');
}

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

describe('shouldExcludeConfirmedOutOfStock', () => {
  const merchantId = '11111111-1111-4111-8111-111111111111';

  it('is true for default Explore', () => {
    expect(shouldExcludeConfirmedOutOfStock(productQuery.parse({}), null)).toBe(true);
  });

  it('is false when availability, brand, or merchantId is set', () => {
    expect(shouldExcludeConfirmedOutOfStock(productQuery.parse({ availability: 'in_stock' }), null)).toBe(false);
    expect(shouldExcludeConfirmedOutOfStock(productQuery.parse({ brand: 'zara' }), null)).toBe(false);
    expect(
      shouldExcludeConfirmedOutOfStock(productQuery.parse({}), { id: merchantId, slug: 'zara' }),
    ).toBe(false);
    expect(shouldExcludeConfirmedOutOfStock(productQuery.parse({ merchantId: [merchantId] }), null)).toBe(
      false,
    );
  });
});

describe('buildFilters', () => {
  it('ANDs category with minPrice and maxPrice', () => {
    const q = productQuery.parse({ category: 'apparel', minPrice: 10, maxPrice: 100 });
    const text = sqlText(buildFilters(q, null));
    expect(text).toMatch(/category/);
    expect(text).toMatch(/current_price/);
    expect(text).toMatch(/10\.00/);
    expect(text).toMatch(/100\.00/);
  });

  it('mentions out_of_stock when excluding confirmed OOS', () => {
    const q = productQuery.parse({});
    const withExclude = sqlText(buildFilters(q, null, { excludeConfirmedOutOfStock: true }));
    expect(withExclude).toMatch(/out_of_stock/);
    expect(buildFilters(q, null)).toBeUndefined();
  });
});

describe('sortSql newest', () => {
  it('interleaves merchants so one recrawl cannot own the first page', () => {
    const text = sqlText(sortSql('newest'));
    expect(sortSql('newest')).toHaveLength(2);
    expect(text).toMatch(/row_number/i);
    expect(text).toMatch(/partition/i);
    expect(text).toMatch(/merchant_id/);
    expect(text).toMatch(/in_stock/);
    expect(text).toMatch(/out_of_stock/);
  });
});
