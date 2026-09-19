/**
 * Zod schema for Zammit `GET /api/v2/products/fast` product records.
 */

import { z } from 'zod';

export const zammitVariant = z
  .object({
    id: z.union([z.number(), z.string()]).optional(),
    sku: z.string().nullable().optional(),
    quantity: z.number().nullable().optional(),
    isTracked: z.boolean().optional(),
    isOnSale: z.boolean().optional(),
    priceCents: z.number().nullable().optional(),
    discountedPriceCents: z.number().nullable().optional(),
  })
  .passthrough();

export type ZammitVariant = z.infer<typeof zammitVariant>;

export const zammitProductOption = z
  .object({
    name: z.string(),
    values: z.array(z.string()).default([]),
    option: z
      .object({
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type ZammitProductOption = z.infer<typeof zammitProductOption>;

export const zammitProduct = z
  .object({
    id: z.union([z.number(), z.string()]),
    name: z.string(),
    handle: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    vendor: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    status: z.string().nullable().optional(),
    quantity: z.number().nullable().optional(),
    isTracked: z.boolean().optional(),
    isOnSale: z.boolean().optional(),
    priceCents: z.number().nullable().optional(),
    discountedPriceCents: z.number().nullable().optional(),
    thumbUrl: z.string().nullable().optional(),
    thumbUrls: z.array(z.string()).optional(),
    secondaryThumbUrls: z.array(z.string()).optional(),
    productOptions: z.array(zammitProductOption).optional(),
    variants: z.array(zammitVariant).optional(),
  })
  .passthrough();

export type ZammitProduct = z.infer<typeof zammitProduct>;

export const zammitProductsResponse = z.object({
  success: z.boolean().optional(),
  data: z.object({
    products: z.array(zammitProduct),
    metadata: z
      .object({
        totalCount: z.number().optional(),
        totalPages: z.number().optional(),
        currentPage: z.number().optional(),
        perPage: z.number().optional(),
      })
      .optional(),
  }),
});
