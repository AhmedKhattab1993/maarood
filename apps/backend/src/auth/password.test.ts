import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';
import { signAuthToken, verifyAuthToken } from './token';

describe('password hash', () => {
  it('verifies a hash produced by hashPassword', async () => {
    const stored = await hashPassword('correct-horse-battery');
    expect(await verifyPassword('correct-horse-battery', stored)).toBe(true);
    expect(await verifyPassword('wrong', stored)).toBe(false);
  });
});

describe('auth token', () => {
  const secret = 'test-auth-secret-16chars';
  const userId = '00000000-0000-4000-8000-000000000001';

  it('round-trips userId', () => {
    const token = signAuthToken(userId, secret, 1_700_000_000);
    expect(verifyAuthToken(token, secret, 1_700_000_000)).toEqual({ userId });
  });

  it('rejects expired and tampered tokens', () => {
    const token = signAuthToken(userId, secret, 1_000);
    expect(verifyAuthToken(token, secret, 1_000 + 40 * 24 * 3600)).toBeNull();
    expect(verifyAuthToken(token + 'x', secret, 1_000)).toBeNull();
  });
});
