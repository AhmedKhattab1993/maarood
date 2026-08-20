/**
 * Database connection provider.
 *
 * Single node-postgres Pool wired to the canonical Drizzle schema.
 * Connection string comes from the validated env (MAAROOD_DATABASE_URL).
 */

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@maarood/schema';

/** DI token for the raw pg Pool — advisory-lock sessions need a dedicated client. */
export const PG_POOL = Symbol('PG_POOL');

/** DI token for the Drizzle instance. */
export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDB = NodePgDatabase<typeof schema>;

@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool =>
        new Pool({ connectionString: config.getOrThrow<string>('DATABASE_URL') }),
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool): DrizzleDB => drizzle(pool, { schema }),
    },
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DbModule {}
