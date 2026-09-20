import { describe, it, expect } from 'vitest';
import { shoppingDestination } from './shopping-destination';

const stored = 'https://shop.example.com/products/tee';

describe('shoppingDestination', () => {
  it('accepts the product http(s) redirect URL as-is', () => {
    expect(shoppingDestination(stored)).toEqual({ ok: true, url: stored });
    expect(shoppingDestination('http://shop.example.com/p')).toEqual({
      ok: true,
      url: 'http://shop.example.com/p',
    });
  });

  it('does not invent a fallback when the redirect URL is missing', () => {
    expect(shoppingDestination(null)).toEqual({ ok: false, reason: 'missing' });
    expect(shoppingDestination(undefined)).toEqual({ ok: false, reason: 'missing' });
    expect(shoppingDestination('')).toEqual({ ok: false, reason: 'missing' });
  });

  it('rejects non-http(s) destinations', () => {
    expect(shoppingDestination('javascript:alert(1)')).toEqual({ ok: false, reason: 'invalid' });
    expect(shoppingDestination('ftp://shop.example.com/p')).toEqual({ ok: false, reason: 'invalid' });
    expect(shoppingDestination('not-a-url')).toEqual({ ok: false, reason: 'invalid' });
    expect(shoppingDestination('/products/tee')).toEqual({ ok: false, reason: 'invalid' });
  });
});
