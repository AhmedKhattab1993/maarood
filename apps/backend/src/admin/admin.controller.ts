/**
 * Admin endpoints — JSON only, no UI.
 * Protected by a shared-secret bearer token (AdminAuthGuard, ADMIN_TOKEN env).
 * Send: Authorization: Bearer <ADMIN_TOKEN>.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, isNotNull } from 'drizzle-orm';
import {
  crawlRuns,
  merchants,
  productErrors,
  productRevisions,
  products,
} from '@maarood/schema';
import { DRIZZLE, type DrizzleDB } from '../db/db.module';
import { createMerchantBody, updateMerchantBody } from './admin.dto';
import { AdminAuthGuard } from './admin-auth.guard';

@Controller('admin')
@UseGuards(AdminAuthGuard)
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

  @Patch('merchants/:slug')
  async updateMerchant(@Param('slug') slug: string, @Body() body: unknown) {
    const parsed = updateMerchantBody.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const [updated] = await this.db
      .update(merchants)
      .set(parsed.data)
      .where(eq(merchants.slug, slug))
      .returning();
    if (!updated) throw new NotFoundException('Merchant not found');
    return updated;
  }

  @Delete('products/:id')
  @HttpCode(204)
  async deleteProduct(@Param('id') id: string) {
    const [deleted] = await this.db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (!deleted) throw new NotFoundException('Product not found');
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

  // ---- Ingestion health (freshness, failures, staleness) ----

  @Get('health/ingestion')
  async ingestionHealth() {
    // Active merchants only.
    const active = await this.db
      .select()
      .from(merchants)
      .where(eq(merchants.optedOut, false));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const freshness = await Promise.all(
      active.map(async (m) => {
        // Most recent successful crawl for this merchant.
        const lastSuccess = await this.db
          .select()
          .from(crawlRuns)
          .where(and(eq(crawlRuns.merchantId, m.id), eq(crawlRuns.status, 'completed')))
          .orderBy(desc(crawlRuns.startedAt))
          .limit(1);

        // Most recent crawl of any status.
        const lastAny = await this.db
          .select()
          .from(crawlRuns)
          .where(eq(crawlRuns.merchantId, m.id))
          .orderBy(desc(crawlRuns.startedAt))
          .limit(1);

        const lastRun = lastAny[0]?.startedAt ?? null;
        const ageMin = lastRun ? (Date.now() - lastRun.getTime()) / 60000 : null;

        let state: 'never_crawled' | 'failed' | 'overdue' | 'fresh';
        if (!lastRun) state = 'never_crawled';
        else if (lastAny[0]?.status === 'failed') state = 'failed';
        else if (ageMin !== null && ageMin > m.crawlFrequencyMinutes) state = 'overdue';
        else state = 'fresh';

        return {
          slug: m.slug,
          name: m.name,
          lastCrawlStartedAt: lastRun,
          lastCrawlStatus: lastAny[0]?.status ?? null,
          ageMinutes: ageMin !== null ? Math.round(ageMin) : null,
          frequencyMinutes: m.crawlFrequencyMinutes,
          state,
          lastSuccessfulStartedAt: lastSuccess[0]?.startedAt ?? null,
        };
      }),
    );

    const failed = await this.db
      .select()
      .from(crawlRuns)
      .where(and(eq(crawlRuns.status, 'failed'), isNotNull(crawlRuns.startedAt)))
      .orderBy(desc(crawlRuns.startedAt))
      .limit(20);
    const recentFailures = failed.filter((r) => r.startedAt >= sevenDaysAgo);

    // Stale product counts per merchant.
    const staleRows = await this.db
      .select({ merchantId: products.merchantId, n: count() })
      .from(products)
      .where(isNotNull(products.staleAt))
      .groupBy(products.merchantId);
    const staleByMerchantId = new Map(staleRows.map((r) => [r.merchantId, Number(r.n)]));
    const staleProducts = active.map((m) => ({
      slug: m.slug,
      staleCount: staleByMerchantId.get(m.id) ?? 0,
    }));

    return {
      generatedAt: new Date().toISOString(),
      freshness,
      recentFailures,
      staleProducts,
    };
  }
}
