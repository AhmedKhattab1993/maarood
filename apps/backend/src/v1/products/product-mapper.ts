/**
 * Map a raw `products` row (JSON columns stored as text) into the canonical
 * API shape. Parses variants/sizes/colors/imageUrls back into real arrays/objects.
 */

import type { Availability, CurrencyCode, ProductOption, Variant } from '@maarood/schema';

export interface PublicProduct {
  id: string;
  merchantId: string;
  sourceUrl: string;
  merchantProductId: string;
  title: string;
  description: string;
  vendor: string;
  category: string;
  subcategory: string;
  currentPrice: number;
  previousPrice: number | null;
  currency: CurrencyCode;
  availability: Availability;
  variants: Variant[];
  options: ProductOption[];
  sizes: string[];
  colors: string[];
  imageUrls: string[];
  redirectUrl: string | null;
  revisionNumber: number;
  stale: boolean;
  lastSeenAt: string;
  lastUpdatedAt: string | null;
}

function safeParseArray<T>(value: unknown): T[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function mapProduct(row: Record<string, unknown>): PublicProduct {
  return {
    id: row.id as string,
    merchantId: row.merchantId as string,
    sourceUrl: row.sourceUrl as string,
    merchantProductId: row.merchantProductId as string,
    title: row.title as string,
    description: row.description as string,
    vendor: (row.vendor as string) ?? '',
    category: row.category as string,
    subcategory: row.subcategory as string,
    currentPrice: Number(row.currentPrice),
    previousPrice: row.previousPrice !== null ? Number(row.previousPrice) : null,
    currency: row.currency as CurrencyCode,
    availability: row.availability as Availability,
    variants: safeParseArray<Variant>(row.variants),
    options: safeParseArray<ProductOption>(row.options),
    sizes: safeParseArray<string>(row.sizes),
    colors: safeParseArray<string>(row.colors),
    imageUrls: safeParseArray<string>(row.imageUrls),
    redirectUrl: (row.redirectUrl as string | null) ?? null,
    revisionNumber: row.revisionNumber as number,
    stale: row.staleAt !== null && row.staleAt !== undefined,
    lastSeenAt: row.lastSeenAt as string,
    lastUpdatedAt: (row.lastUpdatedAt as string | null) ?? null,
  };
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
