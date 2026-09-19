/**
 * Branding HTML/JSON → absolute http(s) logo URL.
 *
 * Shopify/Woo homepages (JSON-LD, header <img>, icons) and Magento
 * `storeConfig` GraphQL. Pure: no network. Callers fetch the body.
 */

const PAYMENT_OR_PLACEHOLDER =
  /visa|master-?card|paypal|apple-?pay|google-?pay|\bamex\b|instapay|\bvalu\b|\bmada\b|placeholder|Magento_Catalog\/images/i;

const BRAND_TYPES = /^(organization|brand|website|store)$|store$/i;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Resolve relative and protocol-relative URLs against the merchant origin. */
export function toAbsoluteHttpUrl(src: string, baseUrl: string): string | null {
  const trimmed = src.trim().replace(/&amp;/g, '&');
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) {
    return null;
  }
  try {
    const url = trimmed.startsWith('//')
      ? new URL(`${new URL(baseUrl).protocol}${trimmed}`)
      : new URL(trimmed, baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (PAYMENT_OR_PLACEHOLDER.test(url.href)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const m = tag.match(re);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

function imgSrc(tag: string): string | null {
  const direct = attr(tag, 'src') ?? attr(tag, 'data-src') ?? attr(tag, 'data-master');
  if (direct && !direct.startsWith('data:')) {
    return direct.includes('{width}') ? direct.replace(/_?\{width\}x/g, '') : direct;
  }
  const set = attr(tag, 'data-srcset') ?? attr(tag, 'srcset');
  if (!set) return null;
  const first = set.split(',')[0]?.trim().split(/\s+/)[0];
  return first && !first.startsWith('data:') ? first : null;
}

function logoField(value: unknown, baseUrl: string): string | null {
  if (typeof value === 'string') return toAbsoluteHttpUrl(value, baseUrl);
  if (isObject(value) && typeof value.url === 'string') {
    return toAbsoluteHttpUrl(value.url, baseUrl);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = logoField(item, baseUrl);
      if (found) return found;
    }
  }
  return null;
}

function storeConfigOf(json: unknown): Record<string, unknown> | null {
  if (!isObject(json)) return null;
  if (isObject(json.storeConfig)) return json.storeConfig;
  if (isObject(json.data) && isObject(json.data.storeConfig)) return json.data.storeConfig;
  return null;
}

function magentoLogoFromConfig(sc: Record<string, unknown>, baseUrl: string): string | null {
  const src = sc.header_logo_src;
  if (typeof src !== 'string' || !src.trim()) return null;
  if (/^https?:\/\//i.test(src) || src.startsWith('//')) {
    return toAbsoluteHttpUrl(src, baseUrl);
  }
  const mediaRaw = sc.secure_base_media_url ?? sc.base_media_url;
  const media =
    typeof mediaRaw === 'string' && mediaRaw.trim() ? mediaRaw : new URL(baseUrl).origin + '/media/';
  const mediaBase = media.endsWith('/') ? media : `${media}/`;
  const path = src.replace(/^\/+/, '');
  const joined = path.startsWith('logo/') ? `${mediaBase}${path}` : `${mediaBase}logo/${path}`;
  return toAbsoluteHttpUrl(joined, baseUrl);
}

function typesOf(node: Record<string, unknown>): string[] {
  const t = node['@type'];
  if (typeof t === 'string') return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === 'string');
  return [];
}

function walkJsonLd(node: unknown, visit: (o: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, visit);
    return;
  }
  if (!isObject(node)) return;
  visit(node);
  if (node['@graph'] !== undefined) walkJsonLd(node['@graph'], visit);
  for (const v of Object.values(node)) {
    if (isObject(v) || Array.isArray(v)) walkJsonLd(v, visit);
  }
}

function logoFromJsonLd(html: string, baseUrl: string): string | null {
  const re =
    /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed: unknown = JSON.parse(m[1]!.trim());
      let found: string | null = null;
      walkJsonLd(parsed, (node) => {
        if (found) return;
        if (!typesOf(node).some((t) => BRAND_TYPES.test(t))) return;
        found = logoField(node.logo, baseUrl);
      });
      if (found) return found;
    } catch {
      // skip malformed JSON-LD
    }
  }
  return null;
}

function logoFromJson(json: unknown, baseUrl: string): string | null {
  const sc = storeConfigOf(json);
  if (sc) {
    const magento = magentoLogoFromConfig(sc, baseUrl);
    if (magento) return magento;
  }
  if (!isObject(json)) return null;
  const direct = logoField(json.logo ?? json.logo_url ?? json.logoUrl, baseUrl);
  if (direct) return direct;
  const brand = json.brand ?? (isObject(json.shop) ? json.shop.brand : undefined);
  if (brand !== undefined) return logoFromJson(brand, baseUrl);
  return null;
}

function logoFromHtml(html: string, baseUrl: string): string | null {
  const jsonLd = logoFromJsonLd(html, baseUrl);
  if (jsonLd) return jsonLd;

  const ogLogo = html.match(
    /<meta\b[^>]*\bproperty\s*=\s*["']og:logo["'][^>]*\bcontent\s*=\s*["']([^"']+)["']/i,
  );
  if (ogLogo?.[1]) {
    const url = toAbsoluteHttpUrl(ogLogo[1], baseUrl);
    if (url) return url;
  }

  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imgs) {
    const itemprop = (attr(tag, 'itemprop') ?? '').toLowerCase();
    if (itemprop !== 'logo') continue;
    if (PAYMENT_OR_PLACEHOLDER.test(tag)) continue;
    const src = imgSrc(tag);
    if (!src) continue;
    const url = toAbsoluteHttpUrl(src, baseUrl);
    if (url) return url;
  }
  for (const tag of imgs) {
    if (!/\blogo\b/i.test(tag)) continue;
    if (PAYMENT_OR_PLACEHOLDER.test(tag)) continue;
    const src = imgSrc(tag);
    if (!src) continue;
    const url = toAbsoluteHttpUrl(src, baseUrl);
    if (url) return url;
  }

  const ogImage = html.match(
    /<meta\b[^>]*\bproperty\s*=\s*["']og:image["'][^>]*>/i,
  );
  if (ogImage) {
    const content = attr(ogImage[0]!, 'content');
    if (content && /logo/i.test(content) && !PAYMENT_OR_PLACEHOLDER.test(content)) {
      const url = toAbsoluteHttpUrl(content, baseUrl);
      if (url) return url;
    }
  }

  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  const icons: { score: number; href: string }[] = [];
  for (const tag of links) {
    const rel = (attr(tag, 'rel') ?? '').toLowerCase();
    const href = attr(tag, 'href');
    if (!href) continue;
    if (rel.includes('apple-touch-icon')) {
      icons.push({ score: 1000, href });
      continue;
    }
    if (!rel.includes('icon')) continue;
    const type = (attr(tag, 'type') ?? '').toLowerCase();
    const path = href.split('?')[0]!.toLowerCase();
    const raster =
      type.includes('png') ||
      type.includes('svg') ||
      type.includes('webp') ||
      type.includes('jpeg') ||
      type.includes('jpg') ||
      /\.(png|svg|webp|jpe?g)$/.test(path);
    const sizeMatch = (attr(tag, 'sizes') ?? '').match(/(\d+)/);
    const size = sizeMatch ? Number(sizeMatch[1]) : raster ? 32 : 1;
    icons.push({ score: size, href });
  }
  icons.sort((a, b) => b.score - a.score);
  for (const icon of icons) {
    const url = toAbsoluteHttpUrl(icon.href, baseUrl);
    if (url) return url;
  }

  try {
    return `${new URL(baseUrl).origin}/favicon.ico`;
  } catch {
    return null;
  }
}

/**
 * Extract an absolute http(s) logo URL from merchant branding HTML or JSON.
 * Returns null when nothing usable is present (callers keep the initial avatar).
 */
export function extractLogoUrl(source: string | unknown, baseUrl: string): string | null {
  if (typeof source !== 'string') {
    return logoFromJson(source, baseUrl);
  }
  const trimmed = source.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const fromJson = logoFromJson(parsed, baseUrl);
      if (fromJson) return fromJson;
      if (storeConfigOf(parsed)) return null;
    } catch {
      // HTML that happens to start with '{' — fall through.
    }
  }
  if (!/<(!doctype|html|head|body|img|link|meta|script)\b/i.test(trimmed)) {
    return null;
  }
  return logoFromHtml(source, baseUrl);
}
