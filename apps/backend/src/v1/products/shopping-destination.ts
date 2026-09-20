export function shoppingDestination(
  redirectUrl: string | null | undefined,
): { ok: true; url: string } | { ok: false; reason: 'missing' | 'invalid' } {
  if (redirectUrl == null || redirectUrl.trim() === '') {
    return { ok: false, reason: 'missing' };
  }
  try {
    const parsed = new URL(redirectUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, url: redirectUrl };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
