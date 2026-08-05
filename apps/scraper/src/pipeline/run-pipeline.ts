/**
 * Pipeline orchestrator for a single merchant.
 *
 * Implements the stages from 07_SCRAPING_AND_CATALOG_INGESTION.md:
 *   discover -> retrieve -> extract -> validate -> normalize -> match ->
 *   detect change -> upsert + snapshot -> publish (implicit) -> flag failures.
 *
 * Per-product error isolation: a failure at any stage writes to product_errors
 * and increments records_flagged; the crawl continues. The crawl_run row
 * records overall counts and final status.
 */

import { eq } from 'drizzle-orm';
import {
  crawlRuns,
  merchants,
  productErrors,
  type CrawlRunRow,
} from '@maarood/schema';
import type { ScraperDb } from '../db';
import { connectors } from '../connectors';
import { normalizeShopifyProduct } from './normalize';
import { storeProduct } from './store';

export interface PipelineCounts {
  extracted: number;
  upserted: number;
  flagged: number;
  revisionsCreated: number;
}

export async function runPipeline(db: ScraperDb, merchantSlug: string): Promise<CrawlRunRow> {
  const merchant = await db
    .select()
    .from(merchants)
    .where(eq(merchants.slug, merchantSlug))
    .limit(1);
  if (merchant.length === 0) {
    throw new Error(`Merchant not found: ${merchantSlug}`);
  }
  const m = merchant[0]!;

  const factory = connectors[m.connectorType];
  if (!factory) {
    throw new Error(`No connector registered for type '${m.connectorType}'`);
  }

  // Start crawl run.
  const [run] = await db
    .insert(crawlRuns)
    .values({ merchantId: m.id, status: 'running' })
    .returning();

  const counts: PipelineCounts = { extracted: 0, upserted: 0, flagged: 0, revisionsCreated: 0 };

  try {
    // Stages 1-3: discover + retrieve + extract raw records.
    const connector = factory({ merchantId: m.id, domain: m.domain });
    const rawProducts = await connector.fetchRawProducts();
    counts.extracted = rawProducts.length;

    for (const raw of rawProducts) {
      try {
        // Stage 5-6: normalize (validates source + canonical schemas internally).
        const normalized = normalizeShopifyProduct(raw as never, m.id, m.domain);

        // Stages 7-9: change detection + upsert + snapshot.
        const result = await storeProduct(db, run!.id, normalized);
        counts.upserted += 1;
        if (result.outcome === 'inserted' || result.outcome === 'changed') {
          counts.revisionsCreated += 1;
        }
      } catch (err) {
        // Stage 10: flag failure, continue.
        counts.flagged += 1;
        await db.insert(productErrors).values({
          merchantId: m.id,
          merchantProductId: tryGetId(raw),
          stage: 'normalize',
          errorMessage: err instanceof Error ? err.message : String(err),
          rawPayload: raw as Record<string, unknown>,
          status: 'pending',
        });
      }
    }

    const [finished] = await db
      .update(crawlRuns)
      .set({
        status: 'completed',
        finishedAt: new Date(),
        recordsExtracted: counts.extracted,
        recordsUpserted: counts.upserted,
        recordsFlagged: counts.flagged,
        revisionsCreated: counts.revisionsCreated,
      })
      .where(eq(crawlRuns.id, run!.id))
      .returning();

    return finished!;
  } catch (err) {
    // Whole-run failure (e.g. connector fetch blew up).
    const [finished] = await db
      .update(crawlRuns)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        recordsExtracted: counts.extracted,
        recordsUpserted: counts.upserted,
        recordsFlagged: counts.flagged,
        revisionsCreated: counts.revisionsCreated,
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(crawlRuns.id, run!.id))
      .returning();

    return finished!;
  }
}

function tryGetId(raw: unknown): string | null {
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    const id = (raw as { id: unknown }).id;
    return id !== null && id !== undefined ? String(id) : null;
  }
  return null;
}
