/**
 * Admin endpoints — JSON only, no UI.
 *
 * SECURITY GAP (intentional for this step): no authentication. Public API
 * exposure must be gated by Cloud Run IAM / an auth layer before production.
 * Auth is a Phase 2 concern per the build order.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import {
  crawlRuns,
  merchants,
  productErrors,
  productRevisions,
  products,
} from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { createMerchantBody } from './admin.dto';

@Controller('admin')
export class AdminController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  // ---- Merchants ----

  @Get('merchants')
  async listMerchants() {
    return this.db.select().from(merchants).orderBy(desc(merchants.createdAt));
  }

  @Post('merchants')
  @HttpCode(201)
  async createMerchant(@Body() body: unknown) {
    const parsed = createMerchantBody.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const [created] = await this.db
      .insert(merchants)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        domain: parsed.data.domain,
        connectorType: parsed.data.connectorType,
        crawlFrequencyMinutes: parsed.data.crawlFrequencyMinutes,
      })
      .returning();
    return created;
  }

  // ---- Crawl runs ----

  @Get('crawl-runs')
  async listCrawlRuns(@Query('merchantSlug') merchantSlug?: string) {
    if (merchantSlug) {
      const merchant = await this.db
        .select({ id: merchants.id })
        .from(merchants)
        .where(eq(merchants.slug, merchantSlug))
        .limit(1);
      if (merchant.length === 0) throw new NotFoundException('Merchant not found');
      return this.db
        .select()
        .from(crawlRuns)
        .where(eq(crawlRuns.merchantId, merchant[0]!.id))
        .orderBy(desc(crawlRuns.startedAt))
        .limit(50);
    }
    return this.db.select().from(crawlRuns).orderBy(desc(crawlRuns.startedAt)).limit(50);
  }

  // ---- Review queue (product errors) ----

  @Get('review-queue')
  async listReviewQueue(@Query('status') status?: 'pending' | 'resolved') {
    const filter = status ? eq(productErrors.status, status) : undefined;
    const query = this.db
      .select()
      .from(productErrors)
      .orderBy(desc(productErrors.createdAt))
      .limit(100);
    return filter ? query.where(filter) : query;
  }

  @Patch('review-queue/:id')
  async resolveError(@Param('id') id: string) {
    const [updated] = await this.db
      .update(productErrors)
      .set({ status: 'resolved', resolvedAt: new Date() })
      .where(and(eq(productErrors.id, id), eq(productErrors.status, 'pending')))
      .returning();
    if (!updated) throw new NotFoundException('Pending error not found');
    return updated;
  }

  // ---- Product revision history ----

  @Get('products/:id/revisions')
  async listRevisions(@Param('id') id: string) {
    // Confirm product exists (404 if not).
    const product = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (product.length === 0) throw new NotFoundException('Product not found');

    return this.db
      .select()
      .from(productRevisions)
      .where(eq(productRevisions.productId, id))
      .orderBy(productRevisions.revisionNumber);
  }
}
