/**
 * Brand endpoints — merchants surfaced as "brands" to the public API.
 *   GET /v1/brands           — list brands with product counts
 *   GET /v1/brands/:slug     — brand detail + paginated products
 */

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { merchants, products } from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { productQuery } from './products/products.dto';
import { mapProduct, type PaginatedResult, type PublicProduct } from './products/product-mapper';

@Controller('v1/brands')
export class BrandsController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list() {
    const rows = await this.db
      .select({
        id: merchants.id,
        name: merchants.name,
        slug: merchants.slug,
        domain: merchants.domain,
        productCount: count(products.id),
      })
      .from(merchants)
      .leftJoin(products, eq(products.merchantId, merchants.id))
      .where(eq(merchants.optedOut, false))
      .groupBy(merchants.id)
      .orderBy(desc(merchants.name));
    return rows.map((r) => ({ ...r, productCount: Number(r.productCount) }));
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string, @Query() rawQuery: unknown) {
    const brand = await this.db.select().from(merchants).where(eq(merchants.slug, slug)).limit(1);
    if (brand.length === 0 || brand[0]!.optedOut) throw new NotFoundException('Brand not found');

    const parsed = productQuery.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const q = parsed.data;

    const where = eq(products.merchantId, brand[0]!.id);
    const totalRows = await this.db.select({ n: count() }).from(products).where(where);
    const total = Number(totalRows[0]?.n ?? 0);
    const offset = (q.page - 1) * q.limit;
    const rows = await this.db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.lastSeenAt))
      .limit(q.limit)
      .offset(offset);

    return {
      brand: { id: brand[0]!.id, name: brand[0]!.name, slug: brand[0]!.slug, domain: brand[0]!.domain },
      products: {
        items: rows.map((r) => mapProduct(r as unknown as Record<string, unknown>)),
        page: q.page,
        limit: q.limit,
        total,
      } satisfies PaginatedResult<PublicProduct>,
    };
  }
}
