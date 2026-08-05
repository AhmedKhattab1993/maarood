/**
 * Public product endpoints.
 *   GET /v1/products          — paginated, filtered list
 *   GET /v1/products/:id      — single product
 *   GET /v1/products/:id/redirect — log outbound click, 302 to merchant
 */

import {
  Controller,
  Get,
  Headers,
  Inject,
  NotFoundException,
  Param,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { outboundClicks, products } from '@maarood/schema';
import type { Response } from 'express';
import { DRIZZLE, type DrizzleDB } from '../../db/db.module';
import { productQuery } from './products.dto';
import { buildFilters, resolveBrandFilter, sortSql } from './product-filter';
import { mapProduct, type PaginatedResult, type PublicProduct } from './product-mapper';

@Controller('v1/products')
export class ProductsController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async list(@Query() rawQuery: unknown): Promise<PaginatedResult<PublicProduct>> {
    const parsed = productQuery.safeParse(rawQuery);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const q = parsed.data;

    const brand = await resolveBrandFilter(this.db, q);
    const where = buildFilters(q, brand);

    const totalRows = await this.db
      .select({ n: count() })
      .from(products)
      .where(where);
    const total = Number(totalRows[0]?.n ?? 0);

    const offset = (q.page - 1) * q.limit;
    const rows = await this.db
      .select()
      .from(products)
      .where(where)
      .orderBy(sortSql(q.sort))
      .limit(q.limit)
      .offset(offset);

    return { items: rows.map((r) => mapProduct(r as unknown as Record<string, unknown>)), page: q.page, limit: q.limit, total };
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<PublicProduct> {
    const rows = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (rows.length === 0) throw new NotFoundException('Product not found');
    return mapProduct(rows[0] as unknown as Record<string, unknown>);
  }

  @Get(':id/redirect')
  async redirect(
    @Param('id') id: string,
    @Headers('x-device-id') deviceId: string | undefined,
    @Headers('referer') referer: string | undefined,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const rows = await this.db
      .select({
        id: products.id,
        merchantId: products.merchantId,
        redirectUrl: products.redirectUrl,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('Product not found');
    const p = rows[0]!;
    if (!p.redirectUrl) throw new NotFoundException('Product has no redirect URL');

    // Record the outbound click — Maaroud's primary success metric.
    await this.db.insert(outboundClicks).values({
      productId: p.id,
      merchantId: p.merchantId,
      deviceId: deviceId ?? null,
      destinationUrl: p.redirectUrl,
      referer: referer ?? null,
    });

    res.redirect(302, p.redirectUrl);
  }
}
