import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { DeviceIdGuard } from './device-id.guard';

function mkCtx(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as ExecutionContext;
}

const VALID = '11111111-1111-1111-1111-111111111111';

describe('DeviceIdGuard', () => {
  let guard: DeviceIdGuard;
  beforeEach(() => {
    guard = new DeviceIdGuard();
  });

  it('passes and attaches deviceId for a valid UUID', () => {
    const req = { headers: { 'x-device-id': VALID } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
    expect((req as { deviceId?: string }).deviceId).toBe(VALID);
  });

  it('throws BadRequestException when header is missing', () => {
    expect(() => guard.canActivate(mkCtx({}))).toThrow(BadRequestException);
  });

  it('throws BadRequestException when header is not a UUID', () => {
    expect(() => guard.canActivate(mkCtx({ 'x-device-id': 'not-a-uuid' }))).toThrow(
      BadRequestException,
    );
  });
});
