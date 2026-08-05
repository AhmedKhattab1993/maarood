/**
 * Search service — PostgreSQL full-text search + pg_trgm typo tolerance.
 *
 * Strategy: combine trigram similarity (catches typos, partial words) with
 * tsvector ranking (catches full-term relevance), take the better score.
 * Applies the same filters as /v1/products.
 *
 * The `search_vector` column is added by raw SQL in migration 0003 (a GENERATED
 * column Drizzle can't express), so it's referenced via a typed cast.
 */

import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import type { ProductQuery } from '../products/products.dto';
import { mapProduct, type PaginatedResult, type PublicProduct } from '../products/product-mapper';
import { normalizeSearchQuery, toTsqueryString } from './normalize';

// The generated `search_vector` column isn't declared in the Drizzle schema;
// reference it as a typed SQL identifier.
const searchVector = sql.raw('search_vector');

@Injectable()
export class SearchService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async search(text: string, q: ProductQuery): Promise<PaginatedResult<PublicProduct>> {
    const normalized = normalizeSearchQuery(text);
    const tsq = toTsqueryString(normalized);

    if (tsq.length === 0 && !normalized) {
      return { items: [], page: q.page, limit: q.limit, total: 0 };
    }

    // Resolve brand filter to a merchant id.
    let brandId: string | null = null;
    if (q.brand) {
      const rows = await this.db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.slug, q.brand))
        .limit(1);
      brandId = rows[0]?.id ?? null;
    }

    const conditions: SQL[] = [];
    if (brandId) conditions.push(eq(products.merchantId, brandId));
    if (q.category) conditions.push(eq(products.category, q.category));
    if (q.availability) conditions.push(eq(products.availability, q.availability));
    if (q.minPrice !== undefined) conditions.push(gte(products.currentPrice, q.minPrice.toFixed(2)));
    if (q.maxPrice !== undefined) conditions.push(lte(products.currentPrice, q.maxPrice.toFixed(2)));
    if (q.color) conditions.push(sql`${products.colors}::jsonb @> ${JSON.stringify([q.color])}::jsonb`);
    if (q.size) conditions.push(sql`${products.sizes}::jsonb @> ${JSON.stringify([q.size])}::jsonb`);

    // Relevance score: max of FTS rank and trigram similarity on title+description.
    // FTS catches whole-word matches; trigram catches typos / partial words.
    const relevance = sql<number>`greatest(
      coalesce(ts_rank_cd(${searchVector}, to_tsquery('simple', ${tsq})), 0),
      coalesce(similarity(title, ${normalized}), 0) +
      coalesce(similarity(description, ${normalized}), 0) * 0.5
    )`;

    const searchCondition = sql`(to_tsquery('simple', ${tsq}) @@ ${searchVector}
      OR title % ${normalized}
      OR description % ${normalized})`;
    const fullWhere =
      conditions.length > 0 ? and(...conditions, searchCondition) : searchCondition;

    const totalRows = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(products)
      .where(fullWhere);
    const total = Number(totalRows[0]?.n ?? 0);

    const offset = (q.page - 1) * q.limit;
    const rows = await this.db
      .select()
      .from(products)
      .where(fullWhere)
      .orderBy(sql`${relevance} desc`)
      .limit(q.limit)
      .offset(offset);

    return {
      items: rows.map((r) => mapProduct(r as unknown as Record<string, unknown>)),
      page: q.page,
      limit: q.limit,
      total,
    };
  }
}
