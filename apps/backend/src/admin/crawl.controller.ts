/**
 * Crawl trigger endpoint.
 *
 * Vercel Cron calls GET /admin/crawl every 6h with
 * `Authorization: Bearer ${CRON_SECRET}`; the project sets CRON_SECRET equal to
 * ADMIN_TOKEN, so the existing AdminAuthGuard accepts cron requests unchanged.
 * The response arrives after the crawl (or its soft deadline) completes.
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { CrawlService, type CrawlTriggerResult } from './crawl.service';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class CrawlController {
  constructor(private readonly crawl: CrawlService) {}

  @Get('crawl')
  async triggerCrawl(): Promise<CrawlTriggerResult> {
    return this.crawl.triggerCrawl();
  }
}
