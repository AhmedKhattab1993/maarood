/**
 * Environment bootstrap — mirrors theultimate-core convention:
 *   - secrets live in a user-level file (~/.maarood.env), NOT in the repo
 *   - format: KEY=VALUE, one per line; leading `export `, surrounding quotes,
 *     and `#` comments are stripped
 *   - precedence (low → high): code defaults < ~/.maarood.env < process env
 *
 * `loadEnvConfig()` is the single entry point used at app bootstrap.
 */

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { envSchema, type EnvConfig } from './env.schema.js';

const PROJECT_ENV_PATH = join(homedir(), '.maarood.env');

/**
 * Hand-rolled parser matching theultimate-core's `_read_env_file`.
 * Returns a raw KEY -> VALUE map. No interpolation, no dotenv dependency.
 */
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

/**
 * Merge sources by precedence: code default < file < process env.
 * The Zod schema then validates and coerces the merged map into a typed object.
 * Fails fast (throws) on any misconfiguration.
 */
export function loadEnvConfig(): EnvConfig {
  const merged: Record<string, string | undefined> = {
    ...readEnvFile(PROJECT_ENV_PATH),
    ...process.env, // process env wins
  };

  const parsed = envSchema.safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration.\n` +
        `Checked ~/.maarood.env and process env.\nIssues:\n${issues}`,
    );
  }
  return parsed.data;
}
