import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { envSchema } from './env.schema.js';

const REQUIRED = {
  DATABASE_URL: 'postgresql://maarood:dev@localhost:5432/maarood',
  ADMIN_TOKEN: 'test-admin-token-16',
};

describe('envSchema', () => {
  it('defaults CORS_ORIGIN to * so a public web origin is allowed', () => {
    const parsed = envSchema.parse(REQUIRED);
    expect(parsed.CORS_ORIGIN).toBe('*');
    expect(parsed.PORT).toBe(8080);
  });

  it('accepts an explicit public web origin for CORS', () => {
    const parsed = envSchema.parse({
      ...REQUIRED,
      CORS_ORIGIN: 'http://169.58.14.92:3000',
    });
    expect(parsed.CORS_ORIGIN).toBe('http://169.58.14.92:3000');
  });
});

describe('bootstrap bind', () => {
  it('Nest listen binds 0.0.0.0, not loopback', () => {
    const src = readFileSync(new URL('../main.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/listen\(\s*env\.PORT\s*,\s*['"]0\.0\.0\.0['"]\s*\)/);
    expect(src).not.toMatch(/127\.0\.0\.1/);
  });
});
