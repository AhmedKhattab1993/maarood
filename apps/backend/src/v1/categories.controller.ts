/**
 * Category endpoint — distinct categories with product counts.
 *   GET /v1/categories          — global categories
 *   GET /v1/categories?brand=   — categories a given brand sells in
 */

import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import { and, count, eq, ne } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { productQuery } from './products/products.dto';
import { buildFilters, resolveBrandFilter, shouldExcludeConfirmedOutOfStock } from './products/product-filter';

@Controller('v1/categories')
export class CategoriesController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Query() rawQuery: unknown) {
    // Group by category, excluding empty-string categories and opted-out
    // merchants. When `brand` (a merchant slug) is given, counts are scoped to
    // that brand (powers "this brand's categories").
    const parsed = productQuery.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    // Keep alternative categories visible while honoring the other selected filters.
    const q = { ...parsed.data, category: undefined };
    const brand = await resolveBrandFilter(this.db, q);
    const conditions = [eq(merchants.optedOut, false), ne(products.category, ''), buildFilters(q, brand, {
      excludeConfirmedOutOfStock: shouldExcludeConfirmedOutOfStock(q, brand),
    })];
    const rows = await this.db
      .select({ category: products.category, productCount: count() })
      .from(products)
      .innerJoin(merchants, eq(merchants.id, products.merchantId))
      .where(and(...conditions))
      .groupBy(products.category)
      .orderBy(products.category);

    return rows.map((r) => ({ name: r.category, productCount: Number(r.productCount) }));
  }
}
