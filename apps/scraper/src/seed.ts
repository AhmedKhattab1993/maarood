/**
 * Seed script — registers the initial merchants.
 * Idempotent: safe to re-run; ON CONFLICT DO NOTHING on the slug.
 */

import { merchants } from '@maarood/schema';
import { loadEnv } from './config/env';
import { createDb } from './db';

const INITIAL_MERCHANTS = [
  { name: 'NAS Trends', slug: 'nastrends', domain: 'nastrends.com', connectorType: 'shopify' },
];

async function main(): Promise<void> {
  const env = loadEnv();
  const handle = createDb(env.DATABASE_URL);

  const inserted = await handle.db
    .insert(merchants)
    .values(INITIAL_MERCHANTS)
    .onConflictDoNothing({ target: merchants.slug })
    .returning({ slug: merchants.slug });

  if (inserted.length === 0) {
    console.log('Seed: no new merchants inserted (already present).');
  } else {
    console.log(`Seed: inserted ${inserted.length} merchant(s): ${inserted.map((m) => m.slug).join(', ')}`);
  }

  await handle.close();
}

void main();
