import { describe, expect, it } from 'vitest';
import {
  addProductInterest,
  addSeenProducts,
  discoveryIdentity,
  normalizeDiscoveryHistory,
} from './discovery-profile';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const now = 1_800_000_000_000;

describe('discovery history', () => {
  it('learns category and merchant preferences separately from impressions', () => {
    const initial = normalizeDiscoveryHistory(null, now);
    const seen = addSeenProducts(initial, [id(1)], now);
    expect(seen.categories).toEqual({});
    const learned = addProductInterest(
      seen,
      { id: id(1), merchantId: id(2), category: 'bags' },
      now,
    );
    expect(learned.categories.bags).toBe(2);
    expect(learned.merchants[id(2)]).toBe(3);
    expect(learned.seen).toEqual([{ id: id(1), at: now }]);
  });

  it('bounds repeat exposure history and retains the most recent occurrence', () => {
    const history = addSeenProducts(
      normalizeDiscoveryHistory(null, now),
      Array.from({ length: 350 }, (_, n) => id(n)),
      now,
    );
    expect(history.seen).toHaveLength(300);
    const updated = addSeenProducts(history, [id(1), id(1)], now + 100);
    expect(updated.seen[0]).toEqual({ id: id(1), at: now + 100 });
    expect(updated.seen.filter((entry) => entry.id === id(1))).toHaveLength(1);
  });

  it('decays older tastes and expires history so the feed can evolve', () => {
    const fresh = {
      updatedAt: now,
      categories: { bags: 10 },
      merchants: {},
      seen: [{ id: id(1), at: now }],
    };
    const later = normalizeDiscoveryHistory(fresh, now + 8 * 86_400_000);
    expect(later.categories.bags).toBeLessThan(5);
    expect(later.seen).toEqual([]);
    expect(normalizeDiscoveryHistory(fresh, now + 30 * 86_400_000).categories).toEqual({});
  });

  it('ignores corrupt storage, invalid ids, future impressions, and unbounded scores', () => {
    expect(normalizeDiscoveryHistory(null, now).seen).toEqual([]);
    const history = normalizeDiscoveryHistory(
      {
        updatedAt: now,
        categories: { bags: Infinity, footwear: 100, bogus: 2, apparel: -1 },
        merchants: { bad: 1 },
        seen: [null, { id: id(1), at: now + 1 }],
      },
      now,
    );
    expect(history.categories).toEqual({ footwear: 20 });
    expect(history.merchants).toEqual({});
    expect(history.seen).toEqual([]);
  });

  it('isolates guest and signed-in local histories without persisting credentials', () => {
    expect(discoveryIdentity(null)).toBe('guest');
    expect(discoveryIdentity('malformed')).toBe('guest');
    expect(discoveryIdentity(`${id(1)}.123.signature`)).toBe(id(1));
    expect(discoveryIdentity(`${id(1)}.456.renewed`)).toBe(id(1));
    expect(discoveryIdentity(`${id(2)}.123.signature`)).not.toBe(id(1));
  });
});
