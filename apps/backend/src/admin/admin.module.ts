import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { AdminController } from './admin.controller';
import { CrawlController } from './crawl.controller';
import { CRAWL_RUNNER, CrawlService } from './crawl.service';
import { crawlDueMerchants } from '@maarood/scraper';

@Module({
  imports: [DbModule],
  controllers: [AdminController, CrawlController],
  providers: [CrawlService, { provide: CRAWL_RUNNER, useValue: crawlDueMerchants }],
})
export class AdminModule {}
