/**
 * Recategorize existing products using the current taxonomy.
 *
 * Re-derives `category` from each product's title + subcategory (which holds
 * the source product_type) + JSON-stored sizes. Does NOT require a re-crawl.
 *
 * Run after taxonomy changes to backfill categories for already-ingested products.
 *   node apps/scraper/dist/recategorize.js
 */

import { eq } from 'drizzle-orm';
import { categorize, products } from '@maarood/schema';
import { loadEnv } from './config/env';
import { createDb } from './db';

/** Parse the variants JSON text to extract any size/handle-like hints. */
function extractTagsFromVariants(variantsText: unknown): string[] {
  if (typeof variantsText !== 'string') return [];
  try {
    const parsed = JSON.parse(variantsText);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v: { label?: string; size?: string }) => v.label ?? v.size ?? '').filter(Boolean);
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  const handle = createDb(env.DATABASE_URL);

  try {
    const rows = await handle.db
      .select({
        id: products.id,
        title: products.title,
        subcategory: products.subcategory,
        category: products.category,
        variants: products.variants,
      })
      .from(products);

    let changed = 0;
    for (const p of rows) {
      const tags = extractTagsFromVariants(p.variants);
      const { category } = categorize({
        title: p.title,
        productType: p.subcategory, // source product_type preserved here
        tags,
      });
      if (category !== p.category) {
        await handle.db
          .update(products)
          .set({ category })
          .where(eq(products.id, p.id));
        changed += 1;
      }
    }

    // Suppress the unused `ne` import lint by referencing it once.
    console.log(`Recategorized ${changed} of ${rows.length} products.`);
  } finally {
    await handle.close();
  }
}

void main();
