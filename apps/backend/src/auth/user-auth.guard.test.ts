import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { setEnvConfig } from '../config/env-store';
import { signAuthToken } from './token';
import { UserAuthGuard } from './user-auth.guard';

const SECRET = 'supersecret-admin-token-1234';
const USER = '11111111-1111-4111-8111-111111111111';

function mkCtx(headers: Record<string, string | undefined>) {
  const req: { headers: Record<string, string | undefined>; userId?: string } = { headers };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
  return { ctx, req };
}

describe('UserAuthGuard', () => {
  let guard: UserAuthGuard;

  beforeEach(() => {
    guard = new UserAuthGuard();
    setEnvConfig({
      NODE_ENV: 'test',
      PORT: 8080,
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      ADMIN_TOKEN: SECRET,
      CORS_ORIGIN: '*',
    });
  });

  it('attaches userId for a valid bearer token', () => {
    const token = signAuthToken(USER, SECRET);
    const { ctx, req } = mkCtx({ authorization: `Bearer ${token}` });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(req.userId).toBe(USER);
  });

  it('rejects a missing token', () => {
    const { ctx } = mkCtx({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
