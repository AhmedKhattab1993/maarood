/**
 * Normalize a Shopify product into the Maaroud canonical Product shape,
 * and compute its material-change checksum.
 *
 * Category is derived via the shared Maaroud taxonomy (packages/schema/taxonomy):
 * Shopify product_type alone is sparse, so we match title/type/tags/handle
 * against canonical category keywords (English + Arabic). Variant titles → sizes;
 * tags with a 'color_' prefix → colors.
 */

import type { ShopifyProduct, ShopifyVariant } from '../connectors/shopify/shopify-source.schema';
import { categorize } from '@maarood/schema';
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

  // Per-variant prices (Shopify strings → numbers). Used both for the product
  // roll-up and preserved per variant so shoppers see the full price ladder.
  const variantPrices = variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
  const currentPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;

  const variantCompares = variants
    .map((v) => (v.compare_at_price ? Number(v.compare_at_price) : null))
    .filter((n): n is number => n !== null && !Number.isNaN(n) && n > currentPrice);
  const previousPrice = variantCompares.length > 0 ? Math.max(...variantCompares) : null;

  // Structured options: prefer Shopify option1 (typically Size) and option2
  // (typically Color) over guessing from the variant title. Fall back to title.
  const sizeFromOption = (v: ShopifyVariant): string | undefined => {
    const o1 = v.option1?.trim();
    if (o1) return o1;
    const t = v.title?.trim();
    return t || undefined;
  };
  const colorFromOption = (v: ShopifyVariant): string | undefined => v.option2?.trim() || undefined;

  const sizes = Array.from(
    new Set(variants.map(sizeFromOption).filter((s): s is string => Boolean(s))),
  ).sort();

  // Colors: from structured option2 values AND legacy color_* tags (union).
  const optionColors = variants.map(colorFromOption).filter((c): c is string => Boolean(c));
  const tagColors = tags
    .filter((t) => t.toLowerCase().startsWith('color_'))
    .map((t) => t.slice('color_'.length).trim())
    .filter(Boolean);
  const colors = Array.from(new Set([...optionColors, ...tagColors]));

  // Structured option groups straight from Shopify (e.g. Size: S/M/L).
  // Drop Shopify's placeholder option for single-variant products ("Title" /
  // "Default Title"), which carries no useful information.
  const options = (raw.options ?? [])
    .filter((o) => o.values.length > 0 && !(o.values.length === 1 && o.values[0]?.toLowerCase() === 'default title'))
    .filter((o) => o.name.toLowerCase() !== 'title')
    .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) }));

  // Derive category from the shared taxonomy. Shopify product_type is sparse,
  // so we match across title/type/tags/handle. Source product_type is preserved
  // as subcategory when it carries useful detail.
  const sourceProductType = (raw.product_type ?? '').trim();
  const { category, subcategory: taxoSub } = categorize({
    title: raw.title,
    productType: sourceProductType,
    tags,
    handle: raw.handle,
  });

  const canonical = {
    merchantId,
    sourceUrl: `https://${domain}/products/${raw.handle}`,
    merchantProductId: String(raw.id),
    title: raw.title,
    description: raw.body_html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? '',
    vendor: (raw.vendor ?? '').trim(),
    category,
    subcategory: taxoSub || sourceProductType,
    currentPrice,
    previousPrice,
    currency: 'EGP', // Egyptian market focus; refined per-merchant if needed later.
    availability: toAvailability(variants),
    variants: variants.map((v) => {
      const price = Number(v.price);
      const compare = v.compare_at_price ? Number(v.compare_at_price) : null;
      return {
        label: v.title,
        size: sizeFromOption(v),
        color: colorFromOption(v),
        sku: v.sku ?? undefined,
        price: Number.isNaN(price) ? undefined : price,
        compareAtPrice:
          compare !== null && !Number.isNaN(compare) && compare > price ? compare : null,
        availability: v.available ? 'in_stock' : ('out_of_stock' as Availability),
      };
    }),
    options,
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
