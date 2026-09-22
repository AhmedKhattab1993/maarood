/**
 * SQL behavior against a migrated PostgreSQL database. All fixtures live in
 * transaction-local temporary tables; the catalog and schema are untouched.
 * Run with MAAROOD_TEST_DATABASE_URL pointing at the local development DB.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool, type PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@maarood/schema';
import type { DrizzleDB } from '../../db/db.module';
import { CategoriesController } from '../categories.controller';
import { FacetsController } from '../facets/facets.controller';
import { productQuery } from '../products/products.dto';
import { SearchService } from './search.service';

const url = process.env.MAAROOD_TEST_DATABASE_URL;
const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;

describe.skipIf(!url)('search SQL and scoped catalog choices', () => {
  let pool: Pool;
  let client: PoolClient;
  let service: SearchService;
  let db: DrizzleDB;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 1 });
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(`
      CREATE TEMP TABLE merchants (LIKE public.merchants INCLUDING DEFAULTS) ON COMMIT DROP;
      CREATE TEMP TABLE products (LIKE public.products INCLUDING DEFAULTS INCLUDING GENERATED) ON COMMIT DROP;
    `);
    await client.query(`INSERT INTO merchants (id, name, slug, domain, connector_type, opted_out) VALUES
      ($1, 'Zara', 'zara', 'zara.test', 'shopify', false),
      ($2, 'Off-White', 'off-white', 'off-white.test', 'shopify', false),
      ($3, 'Hidden', 'hidden', 'hidden.test', 'shopify', true)`, [id(101), id(102), id(103)]);
    const fixtures = [
      [1, 101, 'Red shoes', '', 'footwear', 200, ['Red'], ['40']],
      [2, 101, 'Blue shoes', 'Pair with a red bag', 'footwear', 100, ['Blue'], ['41']],
      [3, 101, 'Red bag', 'Pair with shoes', 'bags', 50, ['Red'], ['M']],
      [4, 102, 'Black hoodie', '', 'apparel', 300, ['Black'], ['M']],
      [5, 102, 'Baggy trousers', '', 'apparel', 120, ['Black'], ['M']],
      [6, 102, 'Soft cotton top', 'Handmade in Cairo', 'apparel', 80, ['Green'], ['S']],
      [7, 102, 'Handmade top', '', 'apparel', 90, ['Green'], ['M']],
      [8, 102, 'حِذَاء أَحْمَر', '', 'footwear', 220, ['أحمر'], ['42']],
      [9, 103, 'Red shoes', '', 'footwear', 1, ['Red'], ['40']],
      [10, 101, 'Red jacket', '', 'apparel', 250, ['Red'], ['L']],
      [11, 101, 'White T-Shirt', '', 'apparel', 75, ['White'], ['M']],
    ] as const;
    for (const [productId, merchantId, title, description, category, price, colors, sizes] of fixtures) {
      await client.query(`INSERT INTO products
        (id, merchant_id, source_url, merchant_product_id, title, description, category,
         current_price, currency, colors, sizes, last_seen_at)
        VALUES ($1, $2, 'https://store.test/product', $3, $4, $5, $6, $7, 'EGP', $8, $9, now())`,
      [id(productId), id(merchantId), String(productId), title, description, category, price, JSON.stringify(colors), JSON.stringify(sizes)]);
    }
    db = drizzle(client, { schema });
    service = new SearchService(db);
  });

  afterAll(async () => {
    if (client) {
      await client.query('ROLLBACK');
      client.release();
    }
    await pool?.end();
  });

  const search = (query: string, filters: Record<string, unknown> = {}) =>
    service.search(query, productQuery.parse({ sort: 'relevance', ...filters }));

  it('requires both red and shoes, ignoring incidental suggestions in descriptions', async () => {
    const result = await search('red shoes');
    expect(result.items.map((product) => product.id).sort()).toEqual([id(1), id(8)]);
    expect(result.total).toBe(2);
  });

  it('finds the same intent across Arabic spelling, diacritics, and English titles', async () => {
    const result = await search('الحِذَاء الأَحْمَر');
    expect(result.items.map((product) => product.id).sort()).toEqual([id(1), id(8)]);
  });

  it('keeps whole-word typo tolerance without matching bag inside baggy', async () => {
    expect((await search('hoodi')).items.map((product) => product.id)).toEqual([id(4)]);
    expect((await search('bag')).items.map((product) => product.id)).toEqual([id(3)]);
    expect((await search('red hoodi')).total).toBe(0);
  });

  it('ranks a title match above an incidental description match', async () => {
    expect((await search('handmade')).items.map((product) => product.id)).toEqual([id(7), id(6)]);
  });

  it('respects explicit prices and stable ties instead of forcing relevance', async () => {
    expect((await search('handmade', { sort: 'price_asc' })).items.map((product) => product.id)).toEqual([id(6), id(7)]);
    expect((await search('shoes', { sort: 'price_desc' })).items.map((product) => product.id)).toEqual([id(8), id(1), id(2)]);
    const first = await search('shoes', { page: 1, limit: 1 });
    const second = await search('shoes', { page: 2, limit: 1 });
    expect(first.items[0]?.id).not.toBe(second.items[0]?.id);
    expect((await search('shoes', { page: 1, limit: 1 })).items[0]?.id).toBe(first.items[0]?.id);
  });

  it('returns named-brand products even when the brand is absent from titles', async () => {
    const result = await search('zara');
    expect(result.total).toBe(5);
    expect(result.items.every((product) => product.merchantId === id(101))).toBe(true);
    expect(result.brands[0]).toMatchObject({ slug: 'zara', productCount: 5 });
    expect((await search('zara red shoes')).items.map((product) => product.id)).toEqual([id(1)]);
    expect((await search('off-white hoodi')).items.map((product) => product.id)).toEqual([id(4)]);
  });

  it('applies shared brand, merchant, category, color, and size restrictions', async () => {
    expect((await search('red shoes', { merchantId: [id(101)] })).items.map((product) => product.id)).toEqual([id(1)]);
    expect((await search('shoes', { category: 'أحذية', color: 'blue', size: '41' })).items.map((product) => product.id)).toEqual([id(2)]);
    expect((await search('shoes', { brand: 'missing' })).total).toBe(0);
    expect((await search('shoes', { brand: "zara' OR '1'='1" })).total).toBe(0);
    expect((await search('shoes', { brand: 'hidden' })).total).toBe(0);
    expect((await search('zara shoes', { merchantId: [id(102)] })).total).toBe(0);
  });

  it('handles punctuation-only input and hyphenated garment names', async () => {
    expect((await search('!! & |')).total).toBe(0);
    expect((await search('white t-shirt')).items.map((product) => product.id)).toEqual([id(11)]);
  });

  it('scopes categories to selected brands and other filters, including unknown brands', async () => {
    const controller = new CategoriesController(db);
    expect(await controller.list({ brand: 'missing' })).toEqual([]);
    expect(await controller.list({ brand: 'zara', minPrice: 150 })).toEqual([
      { name: 'apparel', productCount: 1 }, { name: 'footwear', productCount: 1 },
    ]);
    expect(await controller.list({ merchantId: [id(102)], category: 'footwear' })).toEqual([
      { name: 'apparel', productCount: 4 }, { name: 'footwear', productCount: 1 },
    ]);
  });

  it('scopes facets to the catalog and preserves alternative values for the selected facet', async () => {
    const controller = new FacetsController(db);
    expect(await controller.list({ brand: 'missing' })).toEqual({ colors: [], sizes: [] });
    expect(await controller.list({ brand: 'zara', category: 'shoes', color: 'Red' })).toEqual({
      colors: ['Blue', 'Red'], sizes: ['40'],
    });
    expect(await controller.list({ brand: 'zara', category: 'shoes', size: '40' })).toEqual({
      colors: ['Red'], sizes: ['40', '41'],
    });
  });
});
