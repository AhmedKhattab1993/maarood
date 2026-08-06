/**
 * Zod schema for Shopify's public /products.json payload.
 *
 * Shopify's JSON uses snake_case keys (compare_at_price, product_type, etc.).
 * We validate the raw shape as-sent, then the normalizer reads these fields.
 * This is the boundary where Shopify's contract ends and Maarood's begins.
 */

import { z } from 'zod';

export const shopifyVariant = z.object({
  id: z.number(),
  title: z.string(),
  price: z.string(),
  /** Pre-discount price; null when not on sale. Shopify key: compare_at_price. */
  compare_at_price: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  available: z.boolean(),
  position: z.number().optional(),
  // Structured option values (Shopify's real size/color/option fields).
  option1: z.string().nullable().optional(),
  option2: z.string().nullable().optional(),
  option3: z.string().nullable().optional(),
  grams: z.number().optional(),
  requires_shipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
  barcode: z.string().nullable().optional(),
});

export type ShopifyVariant = z.infer<typeof shopifyVariant>;

export const shopifyImage = z.object({
  id: z.number().optional(),
  src: z.string().url(),
  position: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ShopifyImage = z.infer<typeof shopifyImage>;

export const shopifyOption = z.object({
  id: z.number().optional(),
  name: z.string(),
  position: z.number().optional(),
  values: z.array(z.string()),
});

export type ShopifyOption = z.infer<typeof shopifyOption>;

export const shopifyProduct = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  /** Shopify key: body_html. */
  body_html: z.string().nullable().optional(),
  /** Shopify key: product_type. */
  product_type: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  variants: z.array(shopifyVariant),
  images: z.array(shopifyImage).default([]),
  // Structured option groups (e.g. [{name:'Size', values:['S','M','L']}]).
  options: z.array(shopifyOption).default([]),
  published_at: z.string().nullable().optional(),
});

export type ShopifyProduct = z.infer<typeof shopifyProduct>;

export const shopifyProductsResponse = z.object({
  products: z.array(shopifyProduct),
});
