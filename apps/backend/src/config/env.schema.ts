/**
 * Environment variable schema.
 *
 * Names follow the project convention (UPPER_SNAKE_CASE, MAAROOD_ prefix).
 * `ConfigModule.forRoot({ validate })` runs this against the merged
 * environment at boot and fails fast on any misconfiguration.
 */

import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),

  DATABASE_URL: z
    .string()
    .trim()
    .min(1, 'DATABASE_URL is required — set it in ~/.maarood.env or the process env'),

  /** Shared secret required on all /admin/* requests (Authorization: Bearer <token>). */
  ADMIN_TOKEN: z
    .string()
    .trim()
    .min(16, 'ADMIN_TOKEN must be at least 16 characters — set it in ~/.maarood.env'),

  /** Allowed CORS origin(s). '*' by default for the MVP; set to the frontend origin in production. */
  CORS_ORIGIN: z.string().trim().default('*'),

  GCS_BUCKET_NAME: z.string().trim().optional(),

  // Reserved for future use; intentionally not validated as required yet (YAGNI).
  // JWT_SECRET: z.string().min(16),
});

export type EnvConfig = z.infer<typeof envSchema>;
