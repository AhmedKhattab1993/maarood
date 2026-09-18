import { describe, it, expect, afterEach } from 'vitest';
import { loadEnvConfig } from './env.config.js';

const KEYS = ['DATABASE_URL', 'ADMIN_TOKEN', 'CORS_ORIGIN', 'PORT', 'NODE_ENV'] as const;

describe('loadEnvConfig', () => {
  const snapshot: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of Object.keys(snapshot)) {
      const value = snapshot[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('publishes ~/.maarood.env onto process.env so ConfigService can read DATABASE_URL', () => {
    for (const key of KEYS) {
      snapshot[key] = process.env[key];
      delete process.env[key];
    }

    const env = loadEnvConfig();

    expect(process.env.DATABASE_URL).toBe(env.DATABASE_URL);
    expect(process.env.DATABASE_URL && process.env.DATABASE_URL.length).toBeGreaterThan(0);
    expect(process.env.ADMIN_TOKEN).toBe(env.ADMIN_TOKEN);
    expect(process.env.CORS_ORIGIN).toBe(env.CORS_ORIGIN);
    expect(process.env.PORT).toBe(String(env.PORT));
  });
});
