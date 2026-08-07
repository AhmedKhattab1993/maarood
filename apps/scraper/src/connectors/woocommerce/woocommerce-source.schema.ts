/**
 * Zod schema for WooCommerce's public Store API product payload.
 *
 * Mobaco (and any WP + WooCommerce store) exposes
 *   GET /wp-json/wc/store/v1/products?per_page=100&page=N
 * with no authentication. This is retrieval priority #2 (structured JSON)
 * per 07_SCRAPING_AND_CATALOG_INGESTION.md — preferred over HTML scraping.
 *
 * Unlike Shopify, WooCommerce returns the full product (with variations and
 * structured attributes) in one record, and ships the response as a bare JSON
 * array (not wrapped in `{ products: [...] }`).
 */

import { z } from 'zod';

export const wooAttributeTerm = z.object({
  id: z.number().optional(),
  name: z.string(),
  slug: z.string().optional(),
});

export type WooAttributeTerm = z.infer<typeof wooAttributeTerm>;

export const wooAttribute = z.object({
  id: z.number().optional(),
  /** e.g. "Size", "Colour". */
  name: z.string(),
  /** e.g. "pa_size". */
  taxonomy: z.string().optional(),
  /** True when this attribute drives product variations. */
  has_variations: z.boolean().optional(),
  terms: z.array(wooAttributeTerm).default([]),
});

export type WooAttribute = z.infer<typeof wooAttribute>;

export const wooVariationAttribute = z.object({
  name: z.string(),
  /** The slug of the term (lowercase), resolvable via the attribute's terms. */
  value: z.string(),
});

export type WooVariationAttribute = z.infer<typeof wooVariationAttribute>;

export const wooVariation = z.object({
  id: z.number(),
  attributes: z.array(wooVariationAttribute).default([]),
});

export type WooVariation = z.infer<typeof wooVariation>;

export const wooImage = z.object({
  id: z.number().optional(),
  src: z.string().url(),
  name: z.string().optional(),
  alt: z.string().optional(),
});

export type WooImage = z.infer<typeof wooImage>;

/**
 * A few legacy Mobaco products return `images` as a keyed object ({1:{...},2:{...}})
 * instead of an array. Coerce either shape into a plain array.
 */
const imageList = z.preprocess((val) => {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}, z.array(wooImage));

export const wooPrice = z.object({
  /** Current price, in the currency's minor units (divide by 10^minor_unit). */
  price: z.string(),
  /** Pre-discount price. */
  regular_price: z.string(),
  sale_price: z.string().nullable().optional(),
  currency_code: z.string(),
  /** Power-of-ten divisor for prices. 0 for Mobaco (EGP, no decimals). */
  currency_minor_unit: z.number().default(0),
});

export type WooPrice = z.infer<typeof wooPrice>;

export const wooCategory = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

export type WooCategory = z.infer<typeof wooCategory>;

export const wooTag = z.object({
  id: z.number().optional(),
  name: z.string(),
});

export const wooProduct = z.object({
  id: z.number(),
  name: z.string(),
  /** e.g. "variable", "simple". */
  type: z.string().optional(),
  permalink: z.string().url(),
  sku: z.string().nullable().optional(),
  short_description: z.string().optional(),
  description: z.string().nullable().optional(),
  on_sale: z.boolean().optional(),
  prices: wooPrice,
  images: imageList.default([]),
  categories: z.array(wooCategory).default([]),
  tags: z.array(wooTag).default([]),
  attributes: z.array(wooAttribute).default([]),
  variations: z.array(wooVariation).default([]),
  is_in_stock: z.boolean().optional(),
  is_purchasable: z.boolean().optional(),
});

export type WooProduct = z.infer<typeof wooProduct>;

/** A Store API page is a bare JSON array of products. */
export const wooProductsResponse = z.array(wooProduct);
