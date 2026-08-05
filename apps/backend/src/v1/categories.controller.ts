/**
 * Category endpoint — distinct categories with product counts.
 *   GET /v1/categories
 */

import { Controller, Get, Inject } from '@nestjs/common';
import { and, count, eq, ne } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../db/db.module';

@Controller('v1/categories')
export class CategoriesController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list() {
    // Group by category, excluding empty-string categories and opted-out merchants.
    const rows = await this.db
      .select({ category: products.category, productCount: count() })
      .from(products)
      .innerJoin(merchants, eq(merchants.id, products.merchantId))
      .where(and(eq(merchants.optedOut, false), ne(products.category, '')))
      .groupBy(products.category)
      .orderBy(products.category);

    return rows.map((r) => ({ name: r.category, productCount: Number(r.productCount) }));
  }
}
