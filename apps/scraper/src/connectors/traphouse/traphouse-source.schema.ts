/**
 * Zod schema for TRAPHOUSE Supabase `products` rows.
 * `variants` is either the object `{types, links, stock}` or the older
 * `{type, options:[{name,buyLink}]}` array the storefront still serves.
 */

import { z } from 'zod';

const optionName = z.union([
  z.string(),
  z.object({ name: z.string(), buyLink: z.string().optional() }).passthrough(),
]);

export const traphouseVariantType = z
  .object({
    type: z.string(),
    options: z.array(optionName).default([]),
  })
  .passthrough();

export const traphouseVariantsObject = z
  .object({
    types: z.array(traphouseVariantType).default([]),
    links: z.record(z.string()).optional(),
    stock: z.record(z.union([z.number(), z.string(), z.null()])).optional(),
  })
  .passthrough();

export const traphouseProduct = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    price: z.coerce.number(),
    tag: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    alt: z.string().nullable().optional(),
    buy_link: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    variants: z.union([traphouseVariantsObject, z.array(traphouseVariantType)]).nullable().optional(),
  })
  .passthrough();

export type TraphouseProduct = z.infer<typeof traphouseProduct>;

export const traphouseProductsResponse = z.array(traphouseProduct);
