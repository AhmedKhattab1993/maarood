/**
 * Backfill `merchants.logo_url` from each store's branding HTML/JSON.
 * Does not recrawl products. Safe to re-run; leaves existing URLs in place
 * when a fetch yields nothing.
 *
 *   node apps/scraper/dist/refresh-logos.js
 */

import { loadEnv } from './config/env';
import { createDb } from './db';
import { refreshAllMerchantLogos } from './branding/refresh-logo';

async function main(): Promise<void> {
  const env = loadEnv();
  const handle = createDb(env.DATABASE_URL);
  try {
    const rows = await refreshAllMerchantLogos(handle.db);
    const found = rows.filter((r) => r.logoUrl).length;
    console.log(`Logos: ${found}/${rows.length} merchants have a URL`);
  } finally {
    await handle.close();
  }
}

void main();
