/**
 * Scraper environment config — same convention as the backend:
 *   secrets in ~/.maarood.env, UPPER_SNAKE_CASE, DATABASE_URL required.
 * Kept self-contained so the scraper has no runtime dependency on the backend.
 */

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

const PROJECT_ENV_PATH = join(homedir(), '.maarood.env');

function readEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    if (key.startsWith('export ')) key = key.slice('export '.length).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .trim()
    .min(1, 'DATABASE_URL is required — set it in ~/.maarood.env or the process env'),
  MAAROOD_MERCHANT: z.string().trim().optional(),
});

export type ScraperEnv = z.infer<typeof envSchema>;

export function loadEnv(): ScraperEnv {
  const merged = { ...readEnvFile(PROJECT_ENV_PATH), ...process.env };
  const parsed = envSchema.safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid scraper environment.\nIssues:\n${issues}`);
  }
  return parsed.data;
}
