/**
 * Optional real-Postgres regression suite. All data comes from a VALUES-style
 * CTE, so it needs no schema/migrations and cannot modify the target database.
 * MAAROOD_FEED_TEST_DATABASE_URL=postgresql://... npx vitest run apps/backend/src/v1/feed
 */
import { sql } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FeedProfile } from './feed.dto';
import { feedOrderBy } from './feed-ranking';

const url = process.env.MAAROOD_FEED_TEST_DATABASE_URL;
const dialect = new PgDialect();

describe.skipIf(!url)('feed ordering on PostgreSQL (read-only fixtures)', () => {
  const client = new Client({ connectionString: url });

  beforeAll(async () => {
    await client.connect();
    await client.query('SET default_transaction_read_only = on');
  });
  afterAll(async () => { await client.end(); });

  async function page(seed: string, options: {
    offset?: number; limit?: number; profile?: FeedProfile; seenIds?: string[];
  } = {}) {
    const order = feedOrderBy(seed, options.profile ?? { categories: {}, merchants: {} }, options.seenIds ?? []);
    const query = dialect.sqlToQuery(sql`
      with products as (
        select md5('product:' || m::text || ':' || n::text)::uuid as id,
          md5('merchant:' || m::text)::uuid as merchant_id,
          (array['apparel', 'footwear', 'accessories', 'beauty'])[1 + n % 4] as category
        from generate_series(1, 8) m cross join generate_series(1, 80) n
      )
      select id, merchant_id as "merchantId", category from products
      order by ${sql.join(order, sql`, `)}
      limit ${options.limit ?? 24} offset ${options.offset ?? 0}
    `);
    const result = await client.query<{ id: string; merchantId: string; category: string }>(query.sql, query.params);
    return result.rows;
  }

  it('returns one deterministic sequence across page boundaries', async () => {
    const combined = await page('stable-visit');
    const first = await page('stable-visit', { limit: 12 });
    const second = await page('stable-visit', { limit: 12, offset: 12 });
    expect([...first, ...second]).toEqual(combined);
    expect(new Set(combined.map((product) => product.id)).size).toBe(24);
    expect(await page('stable-visit')).toEqual(combined);
  });

  it('changes first-page products on a new visit even for identical preferences', async () => {
    const profile = { categories: { apparel: 10 }, merchants: {} };
    const first = await page('visit-one', { profile });
    const second = await page('visit-two', { profile });
    const firstIds = new Set(first.map((product) => product.id));
    expect(second.filter((product) => firstIds.has(product.id)).length).toBeLessThan(12);
  });

  it('boosts a preferred category while retaining products to explore', async () => {
    const baseline = await page('preference-check', { limit: 60 });
    const personalized = await page('preference-check', {
      limit: 60, profile: { categories: { apparel: 100 }, merchants: {} },
    });
    expect(personalized.filter((product) => product.category === 'apparel').length)
      .toBeGreaterThan(baseline.filter((product) => product.category === 'apparel').length);
    expect(new Set(personalized.map((product) => product.category)).size).toBeGreaterThan(1);
  });

  it('demotes recently seen products behind unseen products', async () => {
    const first = await page('seen-check');
    const seenIds = first.map((product) => product.id);
    const refreshed = await page('seen-check', { seenIds });
    expect(refreshed.some((product) => seenIds.includes(product.id))).toBe(false);
  });

  it('gives every merchant two slots before another merchant gets a third', async () => {
    const firstRound = await page('diversity-check', { limit: 16 });
    const counts = new Map<string, number>();
    for (const product of firstRound) counts.set(product.merchantId, (counts.get(product.merchantId) ?? 0) + 1);
    expect(counts.size).toBe(8);
    expect([...counts.values()]).toEqual(Array.from({ length: 8 }, () => 2));
  });
});
