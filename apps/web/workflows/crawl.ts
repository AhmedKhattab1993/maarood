/**
 * Maarood crawl workflow — production ingestion on Vercel Workflows.
 *
 * Triggered by Vercel Cron (`GET /api/cron/crawl`) every 6h. One durable step
 * per due merchant: each step is an isolated function invocation with automatic
 * retries, so run duration is unbounded and a crashing/deploying platform never
 * loses progress. Observable per run/step in the Vercel dashboard.
 *
 * The pipeline itself lives in `@maarood/scraper` (shared with the CLI); this
 * file only supplies the durable orchestration. Overlapping runs are harmless:
 * the due-logic skips merchants whose last crawl is fresher than their
 * frequency, and the pipeline's upserts are idempotent.
 */

import { FatalError } from 'workflow';
import { createDb, getDueMerchants, runPipeline } from '@maarood/scraper';

export interface CrawlMerchantOutcome {
  slug: string;
  status: 'completed' | 'failed';
  extracted: number;
  upserted: number;
  flagged: number;
}

export async function crawlAll(): Promise<{
  due: number;
  outcomes: CrawlMerchantOutcome[];
}> {
  'use workflow';

  const slugs = await listDueMerchants();

  const outcomes: CrawlMerchantOutcome[] = [];
  for (const slug of slugs) {
    try {
      outcomes.push(await crawlMerchant(slug));
    } catch (err) {
      // Step exhausted its retries — record it and keep crawling the rest.
      console.error(`Crawl step for '${slug}' failed permanently:`, err);
      outcomes.push({ slug, status: 'failed', extracted: 0, upserted: 0, flagged: 0 });
    }
  }

  return { due: slugs.length, outcomes };
}

/** DB read; retryable like any step. Returns slugs only (serializable). */
async function listDueMerchants(): Promise<string[]> {
  'use step';

  const handle = createDb(requireDatabaseUrl());
  try {
    const due = await getDueMerchants(handle.db);
    return due.map((m) => m.slug);
  } finally {
    await handle.close();
  }
}

async function crawlMerchant(slug: string): Promise<CrawlMerchantOutcome> {
  'use step';

  const handle = createDb(requireDatabaseUrl());
  try {
    const run = await runPipeline(handle.db, slug);
    return {
      slug,
      status: run.status === 'completed' ? 'completed' : 'failed',
      extracted: run.recordsExtracted,
      upserted: run.recordsUpserted,
      flagged: run.recordsFlagged,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Retrying can't fix these — skip retries for config/merchant errors.
    if (message.includes('Merchant not found') || message.includes('opted out')) {
      throw new FatalError(`Cannot crawl '${slug}': ${message}`);
    }
    throw err; // transient (network, store down) — auto-retried
  } finally {
    await handle.close();
  }
}

// Be polite to merchant stores: after a failed merchant, retry at most twice.
crawlMerchant.maxRetries = 2;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new FatalError('DATABASE_URL is not set for the crawl workflow.');
  return url;
}
