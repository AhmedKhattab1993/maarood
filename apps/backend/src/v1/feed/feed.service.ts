import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull, lte } from 'drizzle-orm';
import { followedMerchants, merchants, products, savedProducts } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { buildFilters, resolveBrandFilter, shouldExcludeConfirmedOutOfStock } from '../products/product-filter';
import { mapProduct, type PaginatedResult, type PublicProduct } from '../products/product-mapper';
import { preferenceSnapshot, type FeedProfile, type FeedRequest } from './feed.dto';
import { feedOrderBy } from './feed-ranking';

@Injectable()
export class FeedService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private async accountProfile(request: FeedRequest, userId: string | null): Promise<FeedProfile> {
    const profile = {
      categories: { ...request.profile.categories },
      merchants: { ...request.profile.merchants },
    };
    if (!userId) return profile;

    const snapshot = preferenceSnapshot(request.seed);
    const [saved, followed] = await Promise.all([
      this.db.select({ category: products.category, merchantId: products.merchantId })
        .from(savedProducts)
        .innerJoin(products, eq(products.id, savedProducts.productId))
        .where(and(eq(savedProducts.userId, userId), snapshot ? lte(savedProducts.savedAt, snapshot) : undefined))
        .orderBy(desc(savedProducts.savedAt), savedProducts.id)
        .limit(200),
      this.db.select({ merchantId: followedMerchants.merchantId })
        .from(followedMerchants)
        .where(and(eq(followedMerchants.userId, userId), snapshot ? lte(followedMerchants.followedAt, snapshot) : undefined))
        .orderBy(desc(followedMerchants.followedAt), followedMerchants.id)
        .limit(100),
    ]);
    for (const product of saved) {
      const category = product.category.trim().toLowerCase();
      if (category) profile.categories[category] = (profile.categories[category] ?? 0) + 4;
      profile.merchants[product.merchantId] = (profile.merchants[product.merchantId] ?? 0) + 2;
    }
    for (const merchant of followed) {
      profile.merchants[merchant.merchantId] = (profile.merchants[merchant.merchantId] ?? 0) + 12;
    }
    return profile;
  }

  async discover(request: FeedRequest, userId: string | null): Promise<PaginatedResult<PublicProduct>> {
    const [brand, profile] = await Promise.all([
      resolveBrandFilter(this.db, request.query),
      this.accountProfile(request, userId),
    ]);
    const where = and(
      eq(merchants.optedOut, false),
      isNull(products.staleAt),
      buildFilters(request.query, brand, {
        excludeConfirmedOutOfStock: shouldExcludeConfirmedOutOfStock(request.query, brand),
      }),
    );
    const [totals, rows] = await Promise.all([
      this.db.select({ n: count() }).from(products)
        .innerJoin(merchants, eq(merchants.id, products.merchantId))
        .where(where),
      this.db.select({ product: products }).from(products)
        .innerJoin(merchants, eq(merchants.id, products.merchantId))
        .where(where)
        .orderBy(...feedOrderBy(request.seed, profile, request.seenIds))
        .limit(request.limit)
        .offset((request.page - 1) * request.limit),
    ]);
    return {
      items: rows.map(({ product }) => mapProduct(product as unknown as Record<string, unknown>)),
      page: request.page,
      limit: request.limit,
      total: Number(totals[0]?.n ?? 0),
    };
  }
}
