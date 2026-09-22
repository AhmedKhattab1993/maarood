import { describe, expect, it, vi } from 'vitest';
import { feedRequest, preferenceSnapshot } from './feed.dto';

const ID = '11111111-1111-4111-8111-111111111111';

describe('feed request validation', () => {
  it('supports anonymous discovery with just a bounded seed', () => {
    expect(feedRequest.parse({ seed: 'visit-1' })).toMatchObject({
      seed: 'visit-1', page: 1, limit: 24, profile: { categories: {}, merchants: {} }, seenIds: [],
    });
    expect(feedRequest.safeParse({ seed: '' }).success).toBe(false);
    expect(feedRequest.safeParse({ seed: 'x'.repeat(121) }).success).toBe(false);
  });

  it('rejects unbounded or malformed preference and pagination input', () => {
    for (const input of [
      { page: 0 }, { page: 10001 }, { limit: 61 }, { limit: '24' },
      { seenIds: [ID, 'not-a-uuid'] }, { seenIds: Array.from({ length: 301 }, () => ID) },
      { profile: { categories: { apparel: -1 } } },
      { profile: { categories: { apparel: Infinity } } },
      { profile: { merchants: { 'not-a-uuid': 2 } } },
      { profile: { categories: Object.fromEntries(Array.from({ length: 65 }, (_, n) => [`cat${n}`, 1])) } },
    ]) {
      expect(feedRequest.safeParse({ seed: 'visit-1', ...input }).success).toBe(false);
    }
  });

  it('validates shared filter constraints and rejects a caller-supplied identity', () => {
    expect(feedRequest.safeParse({ seed: 'visit-1', query: { minPrice: 500, maxPrice: 100 } }).success).toBe(false);
    expect(feedRequest.safeParse({ seed: 'visit-1', query: { merchantId: 'bad-id' } }).success).toBe(false);
    expect(feedRequest.safeParse({ seed: 'visit-1', userId: ID }).success).toBe(false);
  });
});

describe('preference snapshot', () => {
  it('uses the visit timestamp so later saves and follows do not move page two', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 8, 22));
    const start = Date.now() - 1000;
    expect(preferenceSnapshot(`${start}:random`)?.getTime()).toBe(start);
    expect(preferenceSnapshot('test-seed')).toBeNull();
    expect(preferenceSnapshot(`${Date.now() + 120_000}:future`)).toBeNull();
    expect(preferenceSnapshot('0000000000000:invalid')).toBeNull();
    vi.restoreAllMocks();
  });
});
