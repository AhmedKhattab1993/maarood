/**
 * Scraper CLI entrypoint.
 *
 * Local:   node dist/main.js <merchant-slug>
 * Cloud:   same code; MAAROOD_MERCHANT env injects the target.
 * (Cloud Scheduler → Cloud Tasks → Cloud Run Job handles scheduling in prod;
 *  locally you just run this script. The ingestion code never branches on env.)
 */

import { loadEnv } from './config/env';
import { createDb } from './db';
import { runPipeline } from './pipeline/run-pipeline';

async function main(): Promise<void> {
  const env = loadEnv();
  const slug = process.argv[2] ?? env.MAAROOD_MERCHANT;
  if (!slug) {
    console.error('Usage: node dist/main.js <merchant-slug>  (or set MAAROOD_MERCHANT)');
    process.exit(1);
  }

  const handle = createDb(env.DATABASE_URL);
  try {
    console.log(`Starting crawl for merchant '${slug}' …`);
    const run = await runPipeline(handle.db, slug);
    console.log(
      `Crawl ${run.status}: extracted=${run.recordsExtracted} ` +
        `upserted=${run.recordsUpserted} flagged=${run.recordsFlagged} ` +
        `revisions=${run.revisionsCreated}` +
        (run.errorMessage ? ` error=${run.errorMessage}` : ''),
    );
    if (run.status === 'failed') process.exitCode = 1;
  } finally {
    await handle.close();
  }
}

void main();
