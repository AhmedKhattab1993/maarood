import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // Connection string used only for `db:migrate`; the live app reads it from config.
  dbCredentials: {
    url: process.env.MAAROOD_DATABASE_URL ?? '',
  },
});
