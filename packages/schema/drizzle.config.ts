import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Connection string used only for `db:migrate`; the live app reads it from config.
  // DATABASE_URL is the universal convention (Nest ConfigModule, pg, Neon, Drizzle).
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
