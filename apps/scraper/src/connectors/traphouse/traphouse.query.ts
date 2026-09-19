/**
 * TRAPHOUSE catalog lives in a public Supabase table. Credentials are in the
 * storefront's `/supabase-config.js` (the same file the browser loads).
 */

export function parseSupabaseConfig(js: string): { url: string; anonKey: string } {
  const url = js.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)?.[1];
  const anonKey = js.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)?.[1];
  if (!url || !anonKey) {
    throw new Error('TRAPHOUSE supabase-config.js missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }
  return { url: url.replace(/\/$/, ''), anonKey };
}

export function supabaseProductsUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/rest/v1/products?select=*&order=sort_order.asc`;
}

export function supabaseRestHeaders(anonKey: string): Record<string, string> {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

export function traphouseConfigUrl(domain: string): string {
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${host}/supabase-config.js`;
}

/** Absolutize storefront-relative image paths (`latest drops/foo.jpg`). */
export function traphouseAbsoluteUrl(src: string, domain: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const path = trimmed
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `https://${host}/${path}`;
}
