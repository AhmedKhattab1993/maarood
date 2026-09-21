/**
 * Distinct catalog choices for the filter drawer.
 *   GET /v1/facets
 *   GET /v1/facets?brand=&category=
 *
 * Colors and sizes are JSON text on each product. The response is the most
 * common values, scoped to a brand and/or category when those are set.
 */

import { Controller, Get, Inject, Query } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { tallyFacetValues } from './facet-values';

@Controller('v1/facets')
export class FacetsController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Query('brand') brand?: string, @Query('category') category?: string) {
    const conditions: SQL[] = [eq(merchants.optedOut, false)];
    if (brand) conditions.push(eq(merchants.slug, brand));
    if (category) conditions.push(eq(products.category, category));

    const rows = await this.db
      .select({ colors: products.colors, sizes: products.sizes })
      .from(products)
      .innerJoin(merchants, eq(merchants.id, products.merchantId))
      .where(and(...conditions));

    return {
      colors: tallyFacetValues(rows.map((row) => row.colors)),
      sizes: tallyFacetValues(rows.map((row) => row.sizes)),
    };
  }
}
