/**
 * Map a raw `products` row (JSON columns stored as text) into the canonical
 * API shape. Parses variants/sizes/colors/imageUrls back into real arrays/objects.
 */

import {
  decodeImportedText,
  type Availability,
  type CurrencyCode,
  type ProductOption,
  type Variant,
} from '@maarood/schema';
import { resolveAvailability } from './availability';

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
  availabilityCheckedAt: string | null;
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
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

const HTTP_URL = /^https?:\/\//i;

/** Image column: JSON text or an already-parsed array; keep only http(s) URLs. */
export function parseImageUrls(value: unknown): string[] {
  const out: string[] = [];
  for (const item of safeParseArray<unknown>(value)) {
    if (typeof item !== 'string') continue;
    const url = item.trim();
    if (HTTP_URL.test(url)) out.push(url);
  }
  return out;
}

function parseTimestamp(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function toIsoString(value: unknown): string | null {
  const parsed = parseTimestamp(value);
  return parsed ? parsed.toISOString() : null;
}

export function mapProduct(row: Record<string, unknown>): PublicProduct {
  const storedAvailability = (row.availability as Availability) ?? 'unknown';
  const checkedAt = parseTimestamp(row.availabilityCheckedAt);
  return {
    id: row.id as string,
    merchantId: row.merchantId as string,
    sourceUrl: row.sourceUrl as string,
    merchantProductId: row.merchantProductId as string,
    title: decodeImportedText((row.title as string) ?? ''),
    description: decodeImportedText((row.description as string) ?? ''),
    vendor: decodeImportedText((row.vendor as string) ?? ''),
    category: row.category as string,
    subcategory: row.subcategory as string,
    currentPrice: Number(row.currentPrice),
    previousPrice: row.previousPrice !== null ? Number(row.previousPrice) : null,
    currency: row.currency as CurrencyCode,
    availability: resolveAvailability(storedAvailability, checkedAt),
    availabilityCheckedAt: toIsoString(row.availabilityCheckedAt),
    variants: safeParseArray<Variant>(row.variants),
    options: safeParseArray<ProductOption>(row.options),
    sizes: safeParseArray<string>(row.sizes),
    colors: safeParseArray<string>(row.colors),
    imageUrls: parseImageUrls(row.imageUrls),
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
