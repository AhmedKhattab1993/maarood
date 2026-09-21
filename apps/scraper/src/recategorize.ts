/**
 * Recategorize existing products using the current taxonomy.
 *
 * Re-derives `category` from each product's title + subcategory (the source
 * product type). Does NOT require a re-crawl.
 *
 * Run after taxonomy changes to backfill categories for already-ingested products.
 *   node apps/scraper/dist/recategorize.js
 */

import { eq } from 'drizzle-orm';
import { categorize, products } from '@maarood/schema';
import { loadEnv } from './config/env';
import { createDb } from './db';

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
      })
      .from(products);

    let changed = 0;
    for (const p of rows) {
      // Variant labels are sizes and colors ("مع شنطة", "S / Black"), not tags.
      const { category } = categorize({
        title: p.title,
        productType: p.subcategory, // source product_type preserved here
      });
      if (category !== p.category) {
        await handle.db.update(products).set({ category }).where(eq(products.id, p.id));
        changed += 1;
      }
    }

    console.log(`Recategorized ${changed} of ${rows.length} products.`);
  } finally {
    await handle.close();
  }
}

void main();
