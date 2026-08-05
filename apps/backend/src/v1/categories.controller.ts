/**
 * Category endpoint — distinct categories with product counts.
 *   GET /v1/categories          — global categories
 *   GET /v1/categories?brand=   — categories a given brand sells in
 */

import { Controller, Get, Inject, Query } from '@nestjs/common';
import { and, count, eq, ne } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../db/db.module';

@Controller('v1/categories')
export class CategoriesController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Query('brand') brand?: string) {
    // Group by category, excluding empty-string categories and opted-out
    // merchants. When `brand` (a merchant slug) is given, counts are scoped to
    // that brand (powers "this brand's categories").
    const conditions = [eq(merchants.optedOut, false), ne(products.category, '')];
    if (brand) {
      const resolved = await this.db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.slug, brand))
        .limit(1);
      if (resolved[0]) conditions.push(eq(products.merchantId, resolved[0].id));
    }
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
