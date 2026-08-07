/**
 * Normalize a WooCommerce Store API product into the Maaroud canonical Product
 * shape, and compute its material-change checksum.
 *
 * WooCommerce exposes rich structured data in one record: name, prices (with
 * minor-unit precision), images, source categories, attribute terms (Size /
 * Colour), and per-variation attribute slugs. Category is derived via the
 * shared Maaroud taxonomy, fed by the source category names + title + tags,
 * while the full source category path is preserved as the subcategory.
 */

import { categorize, productSchema, type Availability } from '@maarood/schema';
import { materialChecksum } from '../../pipeline/checksum';
import type { NormalizedProduct } from '../types';
import type { WooAttribute, WooProduct, WooVariation } from './woocommerce-source.schema';

/** Decode the HTML entities WooCommerce leaves in category names (e.g. "Pants &amp; Denim"). */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Strip HTML tags and collapse whitespace from a rich-text field. */
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return decodeEntities(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** WooCommerce prices are strings in minor units; divide by 10^minor_unit. */
function parsePrice(raw: string, minorUnit: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return minorUnit > 0 ? n / 10 ** minorUnit : n;
}

/** Map of attributeName(lower) -> { slug -> term name }. Resolves variation slugs to display names. */
function buildAttributeLookup(attributes: WooAttribute[]): Map<string, Map<string, string>> {
  const lookup = new Map<string, Map<string, string>>();
  for (const attr of attributes) {
    const slugToName = new Map<string, string>();
    for (const term of attr.terms) {
      const slug = term.slug ?? term.name.toLowerCase();
      slugToName.set(slug, term.name);
    }
    lookup.set(attr.name.toLowerCase(), slugToName);
  }
  return lookup;
}

function isSizeAttr(name: string): boolean {
  return name.toLowerCase() === 'size';
}
function isColorAttr(name: string): boolean {
  const n = name.toLowerCase();
  return n === 'colour' || n === 'color';
}

export function normalizeWooCommerceProduct(
  raw: unknown,
  merchantId: string,
): NormalizedProduct {
  const r = raw as WooProduct;

  const minorUnit = r.prices.currency_minor_unit ?? 0;
  const currentPrice = parsePrice(r.prices.price, minorUnit);
  const regular = parsePrice(r.prices.regular_price, minorUnit);
  const previousPrice = regular > currentPrice ? regular : null;

  const attributes = r.attributes ?? [];
  const variations = r.variations ?? [];
  const attrLookup = buildAttributeLookup(attributes);

  const availability: Availability =
    r.is_in_stock !== false && r.is_purchasable !== false ? 'in_stock' : 'out_of_stock';

  // Attribute-derived options (e.g. Size: N002/N004, Colour: ML…).
  const options = attributes
    .filter((a) => a.terms.length > 0)
    .map((a) => ({
      name: a.name.trim(),
      values: a.terms.map((t) => decodeEntities(t.name).trim()).filter(Boolean),
    }));

  // Sizes / colors roll-ups taken straight from the relevant attribute terms.
  const sizes: string[] = [];
  const colors: string[] = [];
  for (const a of attributes) {
    const values = a.terms.map((t) => decodeEntities(t.name).trim()).filter(Boolean);
    if (isSizeAttr(a.name)) sizes.push(...values);
    else if (isColorAttr(a.name)) colors.push(...values);
  }

  /** Resolve a variation's attribute slug to its display term name. */
  const resolveAttr = (name: string, valueSlug: string): string => {
    const map = attrLookup.get(name.toLowerCase());
    return map?.get(valueSlug) ?? valueSlug;
  };

  const variantRecords = variations.map((v: WooVariation) => {
    let size: string | undefined;
    let color: string | undefined;
    for (const a of v.attributes) {
      if (isSizeAttr(a.name)) size = resolveAttr(a.name, a.value).trim();
      else if (isColorAttr(a.name)) color = resolveAttr(a.name, a.value).trim();
    }
    return {
      label: [color, size].filter(Boolean).join(' / ') || size || color || r.name,
      size,
      color,
      price: currentPrice || undefined,
      compareAtPrice: previousPrice,
      availability,
    };
  });

  const categoryNames = (r.categories ?? []).map((c) => decodeEntities(c.name).trim()).filter(Boolean);
  const tagNames = (r.tags ?? []).map((t) => t.name.trim()).filter(Boolean);

  // Derive canonical category from the shared taxonomy, fed by the rich source
  // categories + title + tags. The full source category path is preserved as
  // the subcategory (e.g. "Women / Tops").
  const { category } = categorize({
    title: r.name,
    productType: categoryNames.join(' '),
    tags: tagNames,
  });

  const canonical = {
    merchantId,
    sourceUrl: r.permalink,
    merchantProductId: String(r.id),
    title: decodeEntities(r.name).trim(),
    description: stripHtml(r.description) || stripHtml(r.short_description),
    vendor: '',
    category,
    subcategory: categoryNames.join(' / '),
    currentPrice,
    previousPrice,
    currency: r.prices.currency_code,
    availability,
    variants: variantRecords,
    options,
    sizes: Array.from(new Set(sizes)),
    colors: Array.from(new Set(colors)),
    imageUrls: (r.images ?? []).map((i) => i.src),
    redirectUrl: r.permalink,
    sourceChecksum: '', // filled below
    revisionNumber: 1, // filled by the store stage for existing products
    lastSeenAt: new Date(),
    lastUpdatedAt: null,
  };

  // Validate against the canonical Zod schema before it touches the DB.
  const parsed = productSchema.safeParse(canonical);
  if (!parsed.success) {
    throw new Error(`Normalized product failed canonical validation: ${parsed.error.message}`);
  }

  const sourceChecksum = materialChecksum(parsed.data);
  return { ...parsed.data, sourceChecksum };
}
