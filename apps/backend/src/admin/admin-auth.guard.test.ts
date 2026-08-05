import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { setEnvConfig } from '../config/env-store';
import { AdminAuthGuard } from './admin-auth.guard';

const TOKEN = 'supersecret-admin-token-1234';
const VALID_UUID = '00000000-0000-0000-0000-000000000000';

function mkCtx(headers: Record<string, string | undefined>): { ctx: ExecutionContext; req: { headers: Record<string, string | undefined> } } {
  const req = { headers };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
  return { ctx, req };
}

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;

  beforeEach(() => {
    guard = new AdminAuthGuard();
    setEnvConfig({
      NODE_ENV: 'test',
      PORT: 8080,
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      ADMIN_TOKEN: TOKEN,
      CORS_ORIGIN: '*',
    });
  });

  it('passes for a correct bearer token', () => {
    const { ctx } = mkCtx({ authorization: `Bearer ${TOKEN}` });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws Unauthorized when header is missing', () => {
    const { ctx } = mkCtx({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws Unauthorized for a wrong token', () => {
    const { ctx } = mkCtx({ authorization: 'Bearer wrong-token' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws Unauthorized when not a Bearer scheme', () => {
    const { ctx } = mkCtx({ authorization: `Basic ${TOKEN}` });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('is not vulnerable to length-based timing leaks of a different length', () => {
    // Different-length token must still reject (sanity, not a true timing test).
    const { ctx } = mkCtx({ authorization: 'Bearer short' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('does not accept a UUID-shaped but wrong token', () => {
    const { ctx } = mkCtx({ authorization: `Bearer ${VALID_UUID}` });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
