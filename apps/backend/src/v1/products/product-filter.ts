/**
 * Shared filter + sort builder for product list and search queries.
 * Keeps the WHERE-clause logic in one place so /v1/products and /v1/search
 * filter identically.
 */

import { type SQL, and, eq, gte, lte, sql } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import type { ProductQuery } from './products.dto';

export interface ResolvedBrand {
  id: string;
  slug: string;
}

/**
 * Resolve a `brand` filter (slug) to a merchant id, if present.
 * Returns null when no brand filter is applied.
 */
export async function resolveBrandFilter(
  db: import('../../db/db.module').DrizzleDB,
  q: ProductQuery,
): Promise<ResolvedBrand | null> {
  if (!q.brand) return null;
  const rows = await db
    .select({ id: merchants.id, slug: merchants.slug })
    .from(merchants)
    .where(eq(merchants.slug, q.brand))
    .limit(1);
  return rows[0] ?? null;
}

/** Build the common filter conditions (excluding brand, which is passed in resolved). */
export function buildFilters(
  q: ProductQuery,
  brand: ResolvedBrand | null,
): SQL | undefined {
  const conditions: SQL[] = [];
  if (brand) conditions.push(eq(products.merchantId, brand.id));
  if (q.category) conditions.push(eq(products.category, q.category));
  if (q.availability) conditions.push(eq(products.availability, q.availability));
  if (q.minPrice !== undefined) conditions.push(gte(products.currentPrice, q.minPrice.toFixed(2)));
  if (q.maxPrice !== undefined) conditions.push(lte(products.currentPrice, q.maxPrice.toFixed(2)));
  // color/size are stored as JSON text arrays; a containment check is sufficient for the MVP.
  if (q.color) conditions.push(sql`${products.colors}::jsonb @> ${JSON.stringify([q.color])}::jsonb`);
  if (q.size) conditions.push(sql`${products.sizes}::jsonb @> ${JSON.stringify([q.size])}::jsonb`);
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/** Sort SQL for the given sort option. `relevance` is only meaningful in search. */
export function sortSql(sort: ProductQuery['sort']): SQL {
  switch (sort) {
    case 'price_asc':
      return sql`${products.currentPrice} asc nulls last`;
    case 'price_desc':
      return sql`${products.currentPrice} desc nulls last`;
    case 'relevance':
      // Placeholder; the search service overrides with its own relevance ordering.
      return sql`${products.lastSeenAt} desc nulls last`;
    case 'newest':
    default:
      return sql`${products.lastSeenAt} desc nulls last`;
  }
}
