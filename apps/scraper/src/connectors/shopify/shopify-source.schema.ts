/**
 * Zod schema for Shopify's public /products.json payload.
 * Used to validate raw records before normalization (pipeline stage 4).
 * Shopify's shape is stable; we validate only the fields we consume.
 */

import { z } from 'zod';

export const shopifyVariant = z.object({
  id: z.number(),
  title: z.string(),
  price: z.string(),
  compareAtPrice: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  available: z.boolean(),
  position: z.number().optional(),
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

export const shopifyProduct = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  bodyHtml: z.string().nullable().optional(),
  productType: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  variants: z.array(shopifyVariant),
  images: z.array(shopifyImage).default([]),
  publishedAt: z.string().nullable().optional(),
});

export type ShopifyProduct = z.infer<typeof shopifyProduct>;

export const shopifyProductsResponse = z.object({
  products: z.array(shopifyProduct),
});
