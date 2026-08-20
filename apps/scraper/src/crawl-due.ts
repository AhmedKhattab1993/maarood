/**
 * Crawl every active merchant whose crawl frequency has elapsed.
 *
 * Extracted from the run-all CLI so the backend's /admin/crawl endpoint can
 * trigger the same batch in-process (Vercel Cron -> HTTP -> this function).
 *
 * `deadlineMs` lets an HTTP caller bound the run: once passed, no new merchant
 * is started and `completed: false` is returned. Unvisited merchants stay due,
 * so the next scheduled run picks them up — partial runs are resumable.
 *
 * Skips merchants that are opted_out or whose last crawl is younger than
 * their crawl_frequency_minutes.
 */

import { desc, eq } from 'drizzle-orm';
import { crawlRuns, merchants } from '@maarood/schema';
import type { ScraperDb } from './db';
import { runPipeline } from './pipeline/run-pipeline';

function ageMinutes(startedAt: Date): number {
  return (Date.now() - startedAt.getTime()) / 60000;
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

  const active = await db.select().from(merchants).where(eq(merchants.optedOut, false));

  for (const m of active) {
    if (opts.deadlineMs !== undefined && Date.now() >= opts.deadlineMs) {
      summary.completed = false;
      console.log('Crawl deadline reached — remaining merchants stay due for the next run.');
      break;
    }

    // Find this merchant's most recent crawl.
    const last = await db
      .select({ startedAt: crawlRuns.startedAt })
      .from(crawlRuns)
      .where(eq(crawlRuns.merchantId, m.id))
      .orderBy(desc(crawlRuns.startedAt))
      .limit(1);
    const lastStarted = last[0]?.startedAt;
    const due = !lastStarted || ageMinutes(lastStarted) >= m.crawlFrequencyMinutes;

    if (!due) {
      summary.skipped += 1;
      console.log(
        `Skipping '${m.slug}' — last crawl ${ageMinutes(lastStarted!).toFixed(0)} min ago (freq ${m.crawlFrequencyMinutes} min).`,
      );
      continue;
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
