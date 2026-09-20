/**
 * Shared filter + sort builder for product list and search queries.
 * Keeps the WHERE-clause logic in one place so /v1/products and /v1/search
 * filter identically.
 */

import { type SQL, and, eq, gte, inArray, isNotNull, lte, not, sql } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import type { ProductQuery } from './products.dto';
import { AVAILABILITY_FRESHNESS_HOURS } from './availability';

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

/** Default Explore only: no explicit availability, no brand slug, no merchantId list (Following uses merchantId). */
export function shouldExcludeConfirmedOutOfStock(
  q: ProductQuery,
  brand: ResolvedBrand | null,
): boolean {
  return !q.availability && !q.brand && !brand && !(q.merchantId && q.merchantId.length > 0);
}

function availabilityCheckedAtIsFresh(): SQL {
  return sql`${products.availabilityCheckedAt} > now() - (${AVAILABILITY_FRESHNESS_HOURS} * interval '1 hour')`;
}

/** Build the common filter conditions (excluding brand, which is passed in resolved). */
export function buildFilters(
  q: ProductQuery,
  brand: ResolvedBrand | null,
  options?: { excludeConfirmedOutOfStock?: boolean },
): SQL | undefined {
  const conditions: SQL[] = [];
  if (q.merchantId && q.merchantId.length > 0) {
    conditions.push(inArray(products.merchantId, q.merchantId));
  }
  if (brand) conditions.push(eq(products.merchantId, brand.id));
  if (q.category) conditions.push(eq(products.category, q.category));
  if (q.availability) conditions.push(eq(products.availability, q.availability));
  if (q.minPrice !== undefined) conditions.push(gte(products.currentPrice, q.minPrice.toFixed(2)));
  if (q.maxPrice !== undefined) conditions.push(lte(products.currentPrice, q.maxPrice.toFixed(2)));
  // color/size are stored as JSON text arrays; a containment check is sufficient for the MVP.
  if (q.color) conditions.push(sql`${products.colors}::jsonb @> ${JSON.stringify([q.color])}::jsonb`);
  if (q.size) conditions.push(sql`${products.sizes}::jsonb @> ${JSON.stringify([q.size])}::jsonb`);
  if (options?.excludeConfirmedOutOfStock) {
    const confirmedOutOfStock = and(
      eq(products.availability, 'out_of_stock'),
      isNotNull(products.availabilityCheckedAt),
      availabilityCheckedAtIsFresh(),
    );
    if (confirmedOutOfStock) conditions.push(not(confirmedOutOfStock));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Sort keys for the given option. `relevance` is only meaningful in search.
 *
 * `newest` is merchant-round-robin then recency: a recrawl of one large store
 * must not own the first page of Explore.
 */
export function sortSql(sort: ProductQuery['sort']): SQL[] {
  switch (sort) {
    case 'price_asc':
      return [sql`${products.currentPrice} asc nulls last`];
    case 'price_desc':
      return [sql`${products.currentPrice} desc nulls last`];
    case 'relevance':
      // Placeholder; the search service overrides with its own relevance ordering.
      return [sql`${products.lastSeenAt} desc nulls last`];
    case 'newest':
    default:
      return [
        sql`row_number() over (partition by ${products.merchantId} order by case when ${products.availability} = 'in_stock' and ${products.availabilityCheckedAt} is not null and ${availabilityCheckedAtIsFresh()} then 0 when ${products.availability} = 'out_of_stock' and ${products.availabilityCheckedAt} is not null and ${availabilityCheckedAtIsFresh()} then 2 else 1 end, ${products.lastSeenAt} desc nulls last)`,
        sql`${products.lastSeenAt} desc nulls last`,
      ];
  }
}
