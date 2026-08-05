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

/** DI token for the Drizzle instance. */
export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDB = NodePgDatabase<typeof schema>;

@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DrizzleDB => {
        const databaseUrl = config.getOrThrow<string>('DATABASE_URL');
        const pool = new Pool({ connectionString: databaseUrl });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
