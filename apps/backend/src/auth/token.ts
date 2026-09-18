import { createHmac, timingSafeEqual } from 'node:crypto';

const TTL_SEC = 30 * 24 * 60 * 60;

export function signAuthToken(userId: string, secret: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const exp = nowSec + TTL_SEC;
  const payload = `${userId}.${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAuthToken(
  token: string,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
): { userId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  if (!userId || !expStr || !sig) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < nowSec) return null;
  const payload = `${userId}.${expStr}`;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { userId };
}

export function authSecret(env: { AUTH_SECRET?: string; ADMIN_TOKEN: string }): string {
  return env.AUTH_SECRET && env.AUTH_SECRET.length >= 16 ? env.AUTH_SECRET : env.ADMIN_TOKEN;
}
