/**
 * Batch entrypoint: crawl every active merchant whose crawl frequency has elapsed.
 *
 * Cron-friendly single command. Locally you run it on a timer/cron; on Cloud Run
 * it's the same binary behind Cloud Scheduler. The scheduling logic is the same
 * in both — only the trigger differs.
 *
 * Skips merchants that are opted_out or whose last successful crawl is younger
 * than their crawl_frequency_minutes.
 */

import { desc, eq } from 'drizzle-orm';
import { crawlRuns, merchants } from '@maarood/schema';
import { loadEnv } from './config/env';
import { createDb } from './db';
import { runPipeline } from './pipeline/run-pipeline';

function ageMinutes(startedAt: Date): number {
  return (Date.now() - startedAt.getTime()) / 60000;
}

async function main(): Promise<void> {
  const env = loadEnv();
  const handle = createDb(env.DATABASE_URL);

  try {
    const active = await handle.db
      .select()
      .from(merchants)
      .where(eq(merchants.optedOut, false));

    let crawled = 0;
    let skipped = 0;

    for (const m of active) {
      // Find this merchant's most recent successful crawl.
      const last = await handle.db
        .select({ startedAt: crawlRuns.startedAt })
        .from(crawlRuns)
        .where(eq(crawlRuns.merchantId, m.id))
        .orderBy(desc(crawlRuns.startedAt))
        .limit(1);

      const lastStarted = last[0]?.startedAt;
      const due = !lastStarted || ageMinutes(lastStarted) >= m.crawlFrequencyMinutes;

      if (!due) {
        skipped += 1;
        console.log(`Skipping '${m.slug}' — last crawl ${ageMinutes(lastStarted!).toFixed(0)} min ago (freq ${m.crawlFrequencyMinutes} min).`);
        continue;
      }

      console.log(`Crawling '${m.slug}' …`);
      try {
        const run = await runPipeline(handle.db, m.slug);
        console.log(
          `  ${run.status}: extracted=${run.recordsExtracted} upserted=${run.recordsUpserted} ` +
            `flagged=${run.recordsFlagged} revisions=${run.revisionsCreated}` +
            (run.errorMessage ? ` error=${run.errorMessage}` : ''),
        );
        crawled += 1;
      } catch (err) {
        console.error(`  failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log(`Done. Crawled ${crawled}, skipped ${skipped}.`);
  } finally {
    await handle.close();
  }
}

void main();
