/**
 * Normalize a Shopify product into the Maaroud canonical Product shape,
 * and compute its material-change checksum.
 *
 * Category/size/color matching (pipeline stage 6) is intentionally simple in
 * the MVP: Shopify product_type → category; variant titles → sizes; tags with
 * a 'color_' prefix → colors. Refined taxonomy mapping arrives later.
 */

import type { ShopifyProduct, ShopifyVariant } from '../connectors/shopify/shopify-source.schema';
import { productSchema, type Product, type Availability } from '@maarood/schema';
import { materialChecksum } from './checksum';

function toAvailability(variants: ShopifyVariant[]): Availability {
  if (variants.length === 0) return 'unknown';
  return variants.some((v) => v.available) ? 'in_stock' : 'out_of_stock';
}

/** Parse Shopify tags (string comma-separated or string[]). */
function parseTags(tags: ShopifyProduct['tags']): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export interface NormalizedProduct extends Product {
  sourceChecksum: string;
}

export function normalizeShopifyProduct(
  raw: ShopifyProduct,
  merchantId: string,
  domain: string,
): NormalizedProduct {
  const variants = raw.variants ?? [];
  const images = raw.images ?? [];
  const tags = parseTags(raw.tags);

  // First available variant's price is the displayed price; fall back to min price.
  const prices = variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
  const currentPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const comparePrices = variants
    .map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : null))
    .filter((n): n is number => n !== null && !Number.isNaN(n) && n > currentPrice);
  const previousPrice = comparePrices.length > 0 ? Math.max(...comparePrices) : null;

  const sizes = Array.from(
    new Set(variants.map((v) => v.title?.trim()).filter((s): s is string => Boolean(s))),
  ).sort();

  const colors = tags
    .filter((t) => t.toLowerCase().startsWith('color_'))
    .map((t) => t.slice('color_'.length).trim())
    .filter(Boolean);

  const canonical = {
    merchantId,
    sourceUrl: `https://${domain}/products/${raw.handle}`,
    merchantProductId: String(raw.id),
    title: raw.title,
    description: raw.bodyHtml?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? '',
    category: raw.productType?.trim() ?? '',
    subcategory: '',
    currentPrice,
    previousPrice,
    currency: 'EGP', // Egyptian market focus; refined per-merchant if needed later.
    availability: toAvailability(variants),
    variants: variants.map((v) => ({
      label: v.title,
      size: v.title?.trim() || undefined,
      sku: v.sku ?? undefined,
      availability: v.available ? 'in_stock' : ('out_of_stock' as Availability),
    })),
    sizes,
    colors,
    imageUrls: images.map((i) => i.src),
    redirectUrl: `https://${domain}/products/${raw.handle}`,
    sourceChecksum: '', // filled below
    revisionNumber: 1, // filled by store stage for existing products
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
