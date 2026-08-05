/**
 * Canonical Maarood product schema.
 *
 * Single source of truth for the product record shared across ingestion,
 * normalization, storage, and the public API. Fields mirror the
 * "Canonical product data requirements" in 07_SCRAPING_AND_CATALOG_INGESTION.md.
 *
 * The Drizzle table in ./drizzle/products.ts is typed from these Zod schemas
 * so the DB contract cannot drift from the API contract.
 */

import { z } from 'zod';

/** Three-letter currency code, e.g. "EGP". */
export const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .length(3)
  .brand('CurrencyCode');

export type CurrencyCode = z.infer<typeof currencyCode>;

/** Availability states supported by the canonical schema. */
export const availabilitySchema = z.enum(['in_stock', 'out_of_stock', 'unknown']);
export type Availability = z.infer<typeof availabilitySchema>;

/** Per-variant record. Optional in the MVP; populated when the merchant exposes variants. */
export const variantSchema = z.object({
  label: z.string().trim(),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  availability: availabilitySchema.default('unknown'),
});

export type Variant = z.infer<typeof variantSchema>;

/**
 * Normalized, canonical product record. This is the shape stored in the
 * `products` table and returned by the public API.
 */
export const productSchema = z.object({
  merchantId: z.string().uuid(),
  sourceUrl: z.string().url(),
  merchantProductId: z.string().trim(),
  title: z.string().trim().min(1),
  description: z.string().trim().default(''),
  category: z.string().trim().default(''),
  subcategory: z.string().trim().default(''),
  currentPrice: z.number().nonnegative(),
  previousPrice: z.number().nonnegative().nullable().default(null),
  currency: currencyCode,
  availability: availabilitySchema.default('unknown'),
  variants: z.array(variantSchema).default([]),
  sizes: z.array(z.string().trim()).default([]),
  colors: z.array(z.string().trim()).default([]),
  imageUrls: z.array(z.string().url()).default([]),
  redirectUrl: z.string().url().nullable().default(null),
  sourceChecksum: z.string().trim().default(''),
  lastSeenAt: z.coerce.date(),
  lastUpdatedAt: z.coerce.date().nullable().default(null),
});

export type Product = z.infer<typeof productSchema>;

/** Required identifiers for the merchant/source that owns a product. */
export const merchantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  domain: z.string().trim().min(1),
  /** Per-store crawl cadence, in minutes. */
  crawlFrequencyMinutes: z.number().int().positive().default(1440),
  createdAt: z.coerce.date(),
});

export type Merchant = z.infer<typeof merchantSchema>;
