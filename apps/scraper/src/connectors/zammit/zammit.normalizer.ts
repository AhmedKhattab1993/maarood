/**
 * Normalize a Zammit product into the canonical Maaroud Product.
 */

import { categorize, productSchema, type Availability } from '@maarood/schema';
import { materialChecksum } from '../../pipeline/checksum';
import type { NormalizedProduct } from '../types';
import type { ZammitProduct, ZammitProductOption, ZammitVariant } from './zammit-source.schema';
import { zammitHost } from './zammit.query';

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function centsToPrice(cents: number | null | undefined): number {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return 0;
  return cents / 100;
}

function httpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

function optionKind(option: ZammitProductOption): 'size' | 'color' | 'other' {
  const name = `${option.name} ${option.option?.name ?? ''}`.toLowerCase();
  if (name.includes('size')) return 'size';
  if (name.includes('colour') || name.includes('color')) return 'color';
  return 'other';
}

function toAvailability(r: ZammitProduct): Availability {
  const variants = r.variants ?? [];
  if (variants.length > 0) {
    return variants.some((v) => (v.quantity ?? 0) > 0 || v.isTracked === false)
      ? 'in_stock'
      : 'out_of_stock';
  }
  if (r.isTracked === false) return 'in_stock';
  return (r.quantity ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
}

function salePrices(
  priceCents: number | null | undefined,
  discountedCents: number | null | undefined,
  isOnSale: boolean | undefined,
): { current: number; previous: number | null } {
  const regular = centsToPrice(priceCents);
  const discounted = centsToPrice(discountedCents);
  if (isOnSale && discounted > 0 && discounted < regular) {
    return { current: discounted, previous: regular };
  }
  return { current: regular, previous: null };
}

export function normalizeZammitProduct(
  raw: unknown,
  merchantId: string,
  domain: string,
): NormalizedProduct {
  const r = raw as ZammitProduct;
  const host = zammitHost(domain);
  const handle = (r.handle ?? '').trim();
  const path = handle ? encodeURIComponent(handle) : encodeURIComponent(String(r.id));
  const pageUrl = `https://${host}/en/shop/products/${path}`;

  const { current: currentPrice, previous: previousPrice } = salePrices(
    r.priceCents,
    r.discountedPriceCents,
    r.isOnSale,
  );

  const productOptions = r.productOptions ?? [];
  const options = productOptions
    .filter((o) => o.values.length > 0)
    .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) }));

  const sizes: string[] = [];
  const colors: string[] = [];
  let sizeValues: string[] = [];
  for (const option of productOptions) {
    const values = option.values.map((v) => v.trim()).filter(Boolean);
    const kind = optionKind(option);
    if (kind === 'size') {
      sizes.push(...values);
      sizeValues = values;
    } else if (kind === 'color') {
      colors.push(...values);
    }
  }

  const variantsRaw: ZammitVariant[] = r.variants ?? [];
  const variantRecords = variantsRaw.map((v, i) => {
    const size = sizeValues[i];
    const priced = salePrices(v.priceCents ?? r.priceCents, v.discountedPriceCents, v.isOnSale ?? r.isOnSale);
    const availability: Availability =
      (v.quantity ?? 0) > 0 || v.isTracked === false ? 'in_stock' : 'out_of_stock';
    return {
      label: size || r.name,
      size,
      sku: v.sku?.trim() || undefined,
      price: priced.current || undefined,
      compareAtPrice: priced.previous,
      availability,
    };
  });

  const tags = r.tags ?? [];
  const sourceType = (r.type ?? '').trim();
  const { category, subcategory: taxoSub } = categorize({
    title: r.name,
    productType: sourceType,
    tags,
    handle: handle || undefined,
  });

  const imageUrls: string[] = [];
  const seen = new Set<string>();
  for (const src of [...(r.thumbUrls ?? []), ...(r.secondaryThumbUrls ?? []), r.thumbUrl ?? '']) {
    const url = httpUrl(src);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    imageUrls.push(url);
  }

  const canonical = {
    merchantId,
    sourceUrl: pageUrl,
    merchantProductId: String(r.id),
    title: r.name.trim(),
    description: stripHtml(r.description),
    vendor: (r.vendor ?? '').trim(),
    category,
    subcategory: taxoSub || sourceType,
    currentPrice,
    previousPrice,
    currency: 'EGP',
    availability: toAvailability(r),
    variants: variantRecords,
    options,
    sizes: Array.from(new Set(sizes)),
    colors: Array.from(new Set(colors)),
    imageUrls,
    redirectUrl: pageUrl,
    sourceChecksum: '',
    revisionNumber: 1,
    lastSeenAt: new Date(),
    lastUpdatedAt: null,
  };

  const parsed = productSchema.safeParse(canonical);
  if (!parsed.success) {
    throw new Error(`Normalized product failed canonical validation: ${parsed.error.message}`);
  }
  const sourceChecksum = materialChecksum(parsed.data);
  return { ...parsed.data, sourceChecksum };
}
