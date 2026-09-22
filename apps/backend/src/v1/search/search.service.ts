/** Bilingual, all-intent search with whole-word typo tolerance and brand intent. */
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, inArray, or, sql } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import type { ProductQuery } from '../products/products.dto';
import { buildFilters, resolveBrandFilter, sortSql } from '../products/product-filter';
import { mapProduct, type PaginatedResult, type PublicProduct } from '../products/product-mapper';
import { brandMatchesNormalizedQuery, brandProductQuery } from './brand-match';
import { normalizeSearchQuery } from './normalize';
import { buildSearchSql } from './search-query';
import { buildSearchTerms } from './synonyms';

const BRAND_HIT_LIMIT = 8;

export interface SearchBrandHit {
  id: string;
  name: string;
  slug: string;
  domain: string;
  productCount: number;
  logoUrl: string | null;
}

export interface SearchResult extends PaginatedResult<PublicProduct> {
  brands: SearchBrandHit[];
}

@Injectable()
export class SearchService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async search(text: string, q: ProductQuery): Promise<SearchResult> {
    const normalized = normalizeSearchQuery(text);
    if (!normalized || buildSearchTerms(normalized).length === 0) {
      return { items: [], page: q.page, limit: q.limit, total: 0, brands: [] };
    }

    const [brand, merchantRows] = await Promise.all([
      resolveBrandFilter(this.db, q),
      this.db.select({
        id: merchants.id,
        name: merchants.name,
        slug: merchants.slug,
        domain: merchants.domain,
        logoUrl: merchants.logoUrl,
      }).from(merchants).where(eq(merchants.optedOut, false)).orderBy(asc(merchants.name)),
    ]);
    const filters = buildFilters(q, brand);
    const availableMerchants = merchantRows.filter((merchant) =>
      (!q.brand || merchant.id === brand?.id) &&
      (!q.merchantId?.length || q.merchantId.includes(merchant.id)),
    );
    const brandIntents = availableMerchants.flatMap((merchant) => {
      const rawRemainder = brandProductQuery(merchant.name, merchant.slug, normalized);
      if (rawRemainder === null) return [];
      const remaining = buildSearchTerms(rawRemainder).length > 0 ? rawRemainder : '';
      return [{ merchant, remaining, search: buildSearchSql(remaining) }];
    });
    const genericSearch = buildSearchSql(normalized);
    // A named brand restricts the product search; the name need not occur in
    // each product title. Remaining words still have to match on that product.
    const searchCondition = brandIntents.length > 0
      ? or(...brandIntents.map(({ merchant, remaining, search }) =>
        and(eq(products.merchantId, merchant.id), remaining ? search.condition : sql`true`),
      ))!
      : genericSearch.condition;
    const relevance = brandIntents.length > 0
      ? sql<number>`greatest(${sql.join(brandIntents.map(({ merchant, remaining, search }) =>
        sql`case when ${products.merchantId} = ${merchant.id} then ${remaining ? search.relevance : sql`0`} else 0 end`,
      ), sql`, `)})`
      : genericSearch.relevance;
    const fullWhere = and(eq(merchants.optedOut, false), filters, searchCondition);
    const order = q.sort === 'relevance'
      ? [sql`${relevance} desc`, sql`${products.id} asc`]
      : sortSql(q.sort);
    const brandHits = availableMerchants
      .filter((merchant) => brandMatchesNormalizedQuery(merchant.name, merchant.slug, normalized))
      .slice(0, BRAND_HIT_LIMIT);

    const [brandCounts, totalRows, rows] = await Promise.all([
      brandHits.length > 0
        ? this.db.select({ merchantId: products.merchantId, productCount: count() })
          .from(products)
          .where(and(filters, inArray(products.merchantId, brandHits.map((merchant) => merchant.id))))
          .groupBy(products.merchantId)
        : Promise.resolve([]),
      this.db.select({ n: count() }).from(products)
        .innerJoin(merchants, eq(products.merchantId, merchants.id)).where(fullWhere),
      this.db.select({ product: products }).from(products)
        .innerJoin(merchants, eq(products.merchantId, merchants.id))
        .where(fullWhere).orderBy(...order).limit(q.limit).offset((q.page - 1) * q.limit),
    ]);
    const counts = new Map(brandCounts.map((row) => [row.merchantId, Number(row.productCount)]));

    return {
      items: rows.map(({ product }) => mapProduct(product as unknown as Record<string, unknown>)),
      page: q.page,
      limit: q.limit,
      total: Number(totalRows[0]?.n ?? 0),
      brands: brandHits.map((merchant) => ({ ...merchant, productCount: counts.get(merchant.id) ?? 0 })),
    };
  }
}
