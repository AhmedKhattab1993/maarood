/**
 * Process-wide store for the validated environment config.
 * `loadEnvConfig()` (run once in main.ts) publishes its result here so guards,
 * services, and the bootstrap can read typed config without re-parsing env.
 */

import type { EnvConfig } from './env.schema';

let config: EnvConfig | null = null;

export function setEnvConfig(env: EnvConfig): void {
  config = env;
}

export function getEnvConfig(): EnvConfig {
  if (!config) {
    throw new Error('Env config not initialized — call setEnvConfig() at bootstrap.');
  }
  return config;
}
