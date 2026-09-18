/**
 * Local 6-hour crawl scheduler.
 *
 * Production trigger is Vercel Cron → GET /api/cron/crawl → workflows/crawl.ts.
 * This process is the local analog: same interval, same `crawlDueMerchants`
 * (getDueMerchants + runPipeline). Do not use this on Vercel.
 */

import { loadEnv } from './config/env';
import { createDb } from './db';
import { crawlDueMerchants } from './crawl-due';
import { CRAWL_INTERVAL_MS, runScheduledTick, type TickState } from './schedule-tick';

async function main(): Promise<void> {
  const env = loadEnv();
  const handle = createDb(env.DATABASE_URL);
  const state: TickState = { running: false };

  const tick = (): Promise<'ran' | 'skipped'> =>
    runScheduledTick(async () => {
      console.log(`[crawl:schedule] tick ${new Date().toISOString()}`);
      const summary = await crawlDueMerchants(handle.db);
      console.log(
        `[crawl:schedule] crawled=${summary.crawled} skipped=${summary.skipped} ` +
          `failed=${summary.failed} completed=${summary.completed}`,
      );
    }, state);

  const result = await tick();
  console.log(`[crawl:schedule] initial tick ${result}; next in ${CRAWL_INTERVAL_MS / 3600000}h`);

  setInterval(() => {
    void tick().then((status) => {
      if (status === 'skipped') {
        console.log('[crawl:schedule] skipped overlapping tick');
      }
    });
  }, CRAWL_INTERVAL_MS);
}

void main();

