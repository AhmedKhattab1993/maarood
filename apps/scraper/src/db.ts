/** Drizzle client for the scraper, wired to the shared canonical schema. */

import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@maarood/schema';

export type ScraperDb = NodePgDatabase<typeof schema>;

export interface DbHandle {
  db: ScraperDb;
  close(): Promise<void>;
}

export function createDb(databaseUrl: string): DbHandle {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  return { db, close: () => pool.end() };
}
