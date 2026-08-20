/**
 * Due-merchant selection + the batch crawl used by the run-all CLI.
 *
 * In production the Vercel crawl workflow (apps/web/workflows/crawl.ts) calls
 * `getDueMerchants` and runs one durable step per merchant. `crawlDueMerchants`
 * remains the sequential CLI path (local runs and fallback).
 *
 * `deadlineMs` lets a caller bound the batch: once passed, no new merchant is
 * started and `completed: false` is returned. Unvisited merchants stay due, so
 * the next run picks them up — partial runs are resumable.
 */

import { desc, eq } from 'drizzle-orm';
import { crawlRuns, merchants, type MerchantRow } from '@maarood/schema';
import type { ScraperDb } from './db';
import { runPipeline } from './pipeline/run-pipeline';

function ageMinutes(startedAt: Date): number {
  return (Date.now() - startedAt.getTime()) / 60000;
}

async function lastCrawlStartedAt(db: ScraperDb, merchantId: string): Promise<Date | undefined> {
  const last = await db
    .select({ startedAt: crawlRuns.startedAt })
    .from(crawlRuns)
    .where(eq(crawlRuns.merchantId, merchantId))
    .orderBy(desc(crawlRuns.startedAt))
    .limit(1);
  return last[0]?.startedAt;
}

/**
 * Active merchants whose crawl frequency has elapsed (or that were never
 * crawled). Skips opted-out merchants.
 */
export async function getDueMerchants(db: ScraperDb): Promise<MerchantRow[]> {
  const active = await db.select().from(merchants).where(eq(merchants.optedOut, false));

  const due: MerchantRow[] = [];
  for (const m of active) {
    const lastStarted = await lastCrawlStartedAt(db, m.id);
    if (!lastStarted || ageMinutes(lastStarted) >= m.crawlFrequencyMinutes) {
      due.push(m);
    } else {
      console.log(
        `Skipping '${m.slug}' — last crawl ${ageMinutes(lastStarted).toFixed(0)} min ago (freq ${m.crawlFrequencyMinutes} min).`,
      );
    }
  }
  return due;
}

export interface CrawlDueOptions {
  /** Epoch milliseconds. Once passed, stop starting new merchants. */
  deadlineMs?: number;
}

export interface CrawlSummary {
  crawled: number;
  skipped: number;
  failed: number;
  /** False when the deadline stopped the run before all due merchants were processed. */
  completed: boolean;
}

export async function crawlDueMerchants(
  db: ScraperDb,
  opts: CrawlDueOptions = {},
): Promise<CrawlSummary> {
  const summary: CrawlSummary = { crawled: 0, skipped: 0, failed: 0, completed: true };

  const due = await getDueMerchants(db);
  summary.skipped = (await countActive(db)) - due.length;

  for (const m of due) {
    if (opts.deadlineMs !== undefined && Date.now() >= opts.deadlineMs) {
      summary.completed = false;
      console.log('Crawl deadline reached — remaining merchants stay due for the next run.');
      break;
    }

    console.log(`Crawling '${m.slug}' …`);
    try {
      const run = await runPipeline(db, m.slug);
      console.log(
        `  ${run.status}: extracted=${run.recordsExtracted} upserted=${run.recordsUpserted} ` +
          `flagged=${run.recordsFlagged} revisions=${run.revisionsCreated}` +
          (run.errorMessage ? ` error=${run.errorMessage}` : ''),
      );
      summary.crawled += 1;
    } catch (err) {
      summary.failed += 1;
      console.error(`  failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return summary;
}

async function countActive(db: ScraperDb): Promise<number> {
  const active = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.optedOut, false));
  return active.length;
}
