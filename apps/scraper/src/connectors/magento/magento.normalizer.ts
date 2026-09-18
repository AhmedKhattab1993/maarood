/**
 * Normalize a Magento GraphQL product into the canonical Maaroud Product.
 */

import { categorize, productSchema, type Availability } from '@maarood/schema';
import { materialChecksum } from '../../pipeline/checksum';
import type { NormalizedProduct } from '../types';
import type { MagentoProduct, MagentoVariant } from './magento-source.schema';

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function moneyValue(
  price:
    | { final_price?: { value?: number | null }; regular_price?: { value?: number | null } }
    | undefined,
  kind: 'final' | 'regular',
): number | null {
  const raw = kind === 'final' ? price?.final_price?.value : price?.regular_price?.value;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  return raw;
}

function isPlaceholder(url: string): boolean {
  return (
    url.includes('/placeholder/') ||
    url.includes('Magento_Catalog/images/product/placeholder')
  );
}

/** Size-scale plates must never be imageUrls[0] when a real photo exists. */
const SIZE_CHART =
  /product_measurements|size[_-]?chart|size[_-]?guide|size[_-]?scale|measurements?/i;

export function isSizeChartImage(url: string, label?: string | null): boolean {
  if (SIZE_CHART.test(label ?? '')) return true;
  try {
    return SIZE_CHART.test(new URL(url).pathname);
  } catch {
    return SIZE_CHART.test(url);
  }
}

function catalogImageUrls(r: MagentoProduct): string[] {
  const candidates: Array<{ url?: string | null; label?: string | null } | null | undefined> = [
    r.image,
    r.small_image,
    r.thumbnail,
    ...(r.media_gallery ?? []),
  ];
  const photos: string[] = [];
  const charts: string[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    const url = item?.url?.trim();
    if (!url || !/^https?:\/\//i.test(url) || isPlaceholder(url) || seen.has(url)) continue;
    seen.add(url);
    if (isSizeChartImage(url, item?.label)) charts.push(url);
    else photos.push(url);
  }
  return [...photos, ...charts];
}

function stockToAvailability(status: string | null | undefined): Availability {
  if (!status) return 'unknown';
  const s = status.toUpperCase();
  if (s === 'IN_STOCK') return 'in_stock';
  if (s === 'OUT_OF_STOCK') return 'out_of_stock';
  return 'unknown';
}

export function normalizeMagentoProduct(
  raw: unknown,
  merchantId: string,
  domain: string,
): NormalizedProduct {
  const r = raw as MagentoProduct;
  const minPrice = r.price_range?.minimum_price;
  const currentPrice = moneyValue(minPrice, 'final') ?? moneyValue(minPrice, 'regular') ?? 0;
  const regular = moneyValue(minPrice, 'regular');
  const previousPrice = regular !== null && regular > currentPrice ? regular : null;
  const currency = (minPrice?.final_price?.currency ?? minPrice?.regular_price?.currency ?? 'EGP')
    .trim()
    .toUpperCase();

  const variantsRaw: MagentoVariant[] = r.variants ?? [];
  const sizes: string[] = [];
  const colors: string[] = [];
  const variantRecords = variantsRaw.map((v) => {
    let size: string | undefined;
    let color: string | undefined;
    for (const a of v.attributes ?? []) {
      const code = a.code.toLowerCase();
      if (code === 'size') size = a.label.trim();
      else if (code === 'color' || code === 'colour') color = a.label.trim();
    }
    if (size) sizes.push(size);
    if (color) colors.push(color);
    const vPrice =
      moneyValue(v.product?.price_range?.minimum_price, 'final') ??
      moneyValue(v.product?.price_range?.minimum_price, 'regular');
    const vReg = moneyValue(v.product?.price_range?.minimum_price, 'regular');
    const availability = stockToAvailability(v.product?.stock_status);
    return {
      label: [color, size].filter(Boolean).join(' / ') || size || color || r.name,
      size,
      color,
      sku: v.product?.sku ?? undefined,
      price: vPrice ?? undefined,
      compareAtPrice: vReg !== null && vPrice !== null && vReg > vPrice ? vReg : null,
      availability,
    };
  });

  const parentAvail = stockToAvailability(r.stock_status);
  const availability: Availability = variantRecords.some((v) => v.availability === 'in_stock')
    ? 'in_stock'
    : parentAvail;

  const categoryNames = (r.categories ?? []).map((c) => c.name.trim()).filter(Boolean);
  const { category } = categorize({
    title: r.name,
    productType: categoryNames.join(' '),
    tags: categoryNames,
  });

  const path = (r.url_key ?? r.sku).replace(/^\//, '');
  const pageUrl = `https://${domain.replace(/^https?:\/\//, '')}/${path}`;

  const sizeValues = Array.from(new Set(sizes));
  const colorValues = Array.from(new Set(colors));
  const options = [
    ...(sizeValues.length ? [{ name: 'Size', values: sizeValues }] : []),
    ...(colorValues.length ? [{ name: 'Color', values: colorValues }] : []),
  ];

  const canonical = {
    merchantId,
    sourceUrl: pageUrl,
    merchantProductId: r.sku,
    title: r.name.trim(),
    description: stripHtml(r.description?.html) || stripHtml(r.short_description?.html),
    vendor: '',
    category,
    subcategory: categoryNames.join(' / '),
    currentPrice,
    previousPrice,
    currency,
    availability,
    variants: variantRecords,
    options,
    sizes: sizeValues,
    colors: colorValues,
    imageUrls: catalogImageUrls(r),
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
