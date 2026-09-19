/**
 * Normalize a TRAPHOUSE Supabase product row into the canonical Product.
 */

import { categorize, productSchema, type Availability } from '@maarood/schema';
import { materialChecksum } from '../../pipeline/checksum';
import type { NormalizedProduct } from '../types';
import type { TraphouseProduct } from './traphouse-source.schema';
import { traphouseAbsoluteUrl } from './traphouse.query';

function optionLabel(option: string | { name: string }): string {
  return (typeof option === 'string' ? option : option.name).trim();
}

function variantTypesOf(raw: TraphouseProduct['variants']): Array<{ type: string; options: string[] }> {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((entry) => ({
      type: entry.type,
      options: (entry.options ?? []).map(optionLabel).filter(Boolean),
    }));
  }
  return (raw.types ?? []).map((entry) => ({
    type: entry.type,
    options: (entry.options ?? []).map(optionLabel).filter(Boolean),
  }));
}

function firstBuyLink(raw: TraphouseProduct): string | null {
  const direct = raw.buy_link?.trim();
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  const variants = raw.variants;
  if (variants && !Array.isArray(variants)) {
    for (const href of Object.values(variants.links ?? {})) {
      if (typeof href === 'string' && /^https?:\/\//i.test(href.trim())) return href.trim();
    }
  }
  return null;
}

export function normalizeTraphouseProduct(
  raw: unknown,
  merchantId: string,
  domain: string,
): NormalizedProduct {
  const r = raw as TraphouseProduct;
  const host = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const pageUrl = `https://${host}/?product=${encodeURIComponent(String(r.id))}`;
  const redirect = firstBuyLink(r) ?? pageUrl;

  const types = variantTypesOf(r.variants);
  const options = types
    .filter((t) => t.options.length > 0)
    .map((t) => ({ name: t.type.trim(), values: t.options }));

  const sizes: string[] = [];
  const colors: string[] = [];
  for (const t of types) {
    const name = t.type.toLowerCase();
    if (name.includes('size')) sizes.push(...t.options);
    else if (name.includes('color') || name.includes('colour')) colors.push(...t.options);
  }

  const sizeSet = Array.from(new Set(sizes));
  const colorSet = Array.from(new Set(colors));
  const variantRecords =
    sizeSet.length > 0
      ? sizeSet.map((size) => ({
          label: size,
          size,
          price: r.price,
          availability: 'in_stock' as Availability,
        }))
      : [];

  const soldOut = (r.tag ?? '').trim().toUpperCase() === 'SOLD OUT';
  const availability: Availability = soldOut ? 'out_of_stock' : 'in_stock';

  const { category } = categorize({
    title: r.name,
    productType: r.tag ?? '',
    tags: r.tag ? [r.tag] : [],
  });

  const image = r.image ? traphouseAbsoluteUrl(r.image, domain) : null;

  const canonical = {
    merchantId,
    sourceUrl: pageUrl,
    merchantProductId: String(r.id),
    title: r.name.trim(),
    description: (r.description ?? '').trim(),
    vendor: '',
    category,
    subcategory: (r.tag ?? '').trim(),
    currentPrice: r.price,
    previousPrice: null,
    currency: 'EGP',
    availability,
    variants: variantRecords,
    options,
    sizes: sizeSet,
    colors: colorSet,
    imageUrls: image ? [image] : [],
    redirectUrl: redirect,
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
