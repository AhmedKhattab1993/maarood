/**
 * Zammit storefront API (SUY and other Zammit/Next shops).
 *
 * Public `/products.json` is HTML. The storefront calls
 * `{NEXT_PUBLIC_API_HOST}/api/v2/products/fast?shop_query=true` with a
 * `domain` header matching the shop hostname.
 */

export const ZAMMIT_API_HOST = 'https://api.zammit.shop';
export const ZAMMIT_PAGE_SIZE = 50;

export function zammitHost(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function zammitProductsUrl(
  apiHost: string,
  page: number,
  limit: number = ZAMMIT_PAGE_SIZE,
): string {
  const host = apiHost.replace(/\/$/, '');
  return `${host}/api/v2/products/fast?shop_query=true&page=${page}&limit=${limit}&include_second_thumb=true`;
}

export function zammitStorefrontHeaders(domain: string): Record<string, string> {
  return {
    domain: zammitHost(domain),
    locale: 'en',
    'content-type': 'application/json',
  };
}

/** Read NEXT_PUBLIC_API_HOST from a Zammit `__NEXT_DATA__` blob or shop HTML. */
export function parseZammitApiHost(htmlOrJson: string): string {
  const fromConfig = (config: unknown): string | null => {
    if (!config || typeof config !== 'object') return null;
    const host = (config as { NEXT_PUBLIC_API_HOST?: unknown }).NEXT_PUBLIC_API_HOST;
    if (typeof host === 'string' && /^https?:\/\//i.test(host)) {
      return host.replace(/\/$/, '');
    }
    return null;
  };

  const trimmed = htmlOrJson.trim();
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed) as { runtimeConfig?: unknown };
      const host = fromConfig(data.runtimeConfig);
      if (host) return host;
    } catch {
      // Fall through to HTML / default.
    }
  }

  const match = htmlOrJson.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (match?.[1]) {
    try {
      const data = JSON.parse(match[1]) as { runtimeConfig?: unknown };
      const host = fromConfig(data.runtimeConfig);
      if (host) return host;
    } catch {
      // default host below
    }
  }

  return ZAMMIT_API_HOST;
}
