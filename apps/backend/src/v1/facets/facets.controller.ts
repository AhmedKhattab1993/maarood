/**
 * Distinct catalog choices for the filter drawer.
 *   GET /v1/facets
 *   GET /v1/facets?brand=&category=
 *
 * Colors and sizes are JSON text on each product. The response is the most
 * common values, scoped to a brand and/or category when those are set.
 */

import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { parseFacetArray, tallyFacetValues } from './facet-values';
import { productQuery } from '../products/products.dto';
import { buildFilters, resolveBrandFilter, shouldExcludeConfirmedOutOfStock } from '../products/product-filter';

@Controller('v1/facets')
export class FacetsController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Query() rawQuery: unknown) {
    const parsed = productQuery.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const q = parsed.data;
    const brand = await resolveBrandFilter(this.db, q);
    const conditions = [eq(merchants.optedOut, false), buildFilters({ ...q, color: undefined, size: undefined }, brand, {
      excludeConfirmedOutOfStock: shouldExcludeConfirmedOutOfStock(q, brand),
    })];

    const rows = await this.db
      .select({ colors: products.colors, sizes: products.sizes })
      .from(products)
      .innerJoin(merchants, eq(merchants.id, products.merchantId))
      .where(and(...conditions));

    return {
      // A facet ignores its own selection, so selecting black does not make
      // every other color disappear; the chosen size still scopes colors.
      colors: tallyFacetValues(rows.filter((row) => hasValue(row.sizes, q.size)).map((row) => row.colors)),
      sizes: tallyFacetValues(rows.filter((row) => hasValue(row.colors, q.color)).map((row) => row.sizes)),
    };
  }
}

function hasValue(raw: string, selected: string | undefined): boolean {
  return !selected || parseFacetArray(raw).some((value) => value.toLowerCase() === selected.toLowerCase());
}
