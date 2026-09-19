import { describe, it, expect } from 'vitest';
import { productQuery } from './products.dto';
import { sortSql } from './product-filter';

function sqlText(fragments: ReturnType<typeof sortSql>): string {
  const parts: string[] = [];
  for (const fragment of fragments) {
    for (const chunk of fragment.queryChunks) {
      if (typeof chunk === 'string') parts.push(chunk);
      else if (chunk && typeof chunk === 'object' && 'name' in chunk) {
        parts.push(String((chunk as { name: string }).name));
      } else if (chunk && typeof chunk === 'object' && 'value' in chunk) {
        const value = (chunk as { value: unknown }).value;
        if (Array.isArray(value)) parts.push(value.map(String).join(''));
        else if (typeof value === 'string') parts.push(value);
      }
    }
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

describe('sortSql newest', () => {
  it('interleaves merchants so one recrawl cannot own the first page', () => {
    const text = sqlText(sortSql('newest'));
    expect(sortSql('newest')).toHaveLength(2);
    expect(text).toMatch(/row_number/i);
    expect(text).toMatch(/partition/i);
    expect(text).toMatch(/merchant_id/);
  });
});
