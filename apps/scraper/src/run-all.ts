/**
 * Batch CLI entrypoint: crawl every active merchant whose crawl frequency has
 * elapsed. Production no longer runs this file — Vercel Cron triggers the same
 * logic through the backend's /admin/crawl endpoint — but the CLI remains the
 * local and fallback path.
 */

import { loadEnv } from './config/env';
import { createDb } from './db';
import { crawlDueMerchants } from './crawl-due';

async function main(): Promise<void> {
  const env = loadEnv();
  const handle = createDb(env.DATABASE_URL);

  try {
    const summary = await crawlDueMerchants(handle.db);
    console.log(
      `Done. Crawled ${summary.crawled}, skipped ${summary.skipped}, failed ${summary.failed}.`,
    );
  } finally {
    await handle.close();
  }
}

void main();
