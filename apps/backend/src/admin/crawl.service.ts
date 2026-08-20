/**
 * Crawl trigger used by Vercel Cron (GET /admin/crawl) and manual runs.
 *
 * The crawl runs synchronously within the HTTP request: Vercel's Fluid
 * instances pause once a request finishes, so the work cannot safely continue
 * in the background after responding. A soft deadline stops starting new
 * merchants before the platform's function-duration limit kills the request;
 * the per-merchant due-logic makes partial runs resumable on the next trigger.
 *
 * Overlapping runs are prevented with a Postgres advisory lock held on a
 * dedicated session. If the session dies mid-crawl (instance killed, deploy),
 * Postgres releases the lock automatically — no manual unblocking.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'pg';
import { DRIZZLE, DrizzleDB, PG_POOL } from '../db/db.module';
import type { CrawlDueOptions, CrawlSummary } from '@maarood/scraper';

/** Runs the due-merchant batch. Injectable so tests can stub the pipeline. */
export const CRAWL_RUNNER = Symbol('CRAWL_RUNNER');
export type CrawlRunner = (db: DrizzleDB, opts?: CrawlDueOptions) => Promise<CrawlSummary>;

export type CrawlTriggerResult =
  | { started: false; reason: 'crawl_already_running' }
  | { started: true; summary: CrawlSummary };

/** Stable advisory-lock key derived from a constant name. */
const LOCK_KEY = "hashtext('maarood-crawl')::bigint";

/**
 * Soft deadline: finish the request cleanly before the 800s Pro function
 * limit hard-kills it. Remaining merchants stay due and are picked up by the
 * next scheduled run.
 */
const CRAWL_DEADLINE_MS = 700_000;

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(CRAWL_RUNNER) private readonly runDueCrawl: CrawlRunner,
  ) {}

  async triggerCrawl(): Promise<CrawlTriggerResult> {
    const client = await this.pool.connect();

    let locked: boolean;
    try {
      const res = await client.query<{ locked: boolean }>(
        `SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked`,
      );
      locked = res.rows[0]?.locked === true;
    } catch (err) {
      client.release();
      throw err;
    }

    if (!locked) {
      client.release();
      return { started: false, reason: 'crawl_already_running' };
    }

    const startedAt = Date.now();
    try {
      this.logger.log('Crawl triggered; crawling due merchants …');
      const summary = await this.runDueCrawl(this.db, {
        deadlineMs: startedAt + CRAWL_DEADLINE_MS,
      });
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(0);
      this.logger.log(`Crawl finished in ${seconds}s: ${JSON.stringify(summary)}`);
      return { started: true, summary };
    } finally {
      try {
        await client.query(`SELECT pg_advisory_unlock(${LOCK_KEY})`);
      } catch (err) {
        this.logger.warn(
          `Failed to release crawl advisory lock: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      client.release();
    }
  }
}
