/**
 * Zod schema for Magento GraphQL `products` items (Mobaco storefront).
 * Retrieval is GET https://{domain}/graphql — POST is rejected by the store.
 */

import { z } from 'zod';

const money = z.object({
  value: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
});

const priced = z.object({
  regular_price: money.optional(),
  final_price: money.optional(),
});

const image = z
  .object({
    url: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

export const magentoVariant = z.object({
  product: z
    .object({
      sku: z.string().nullable().optional(),
      stock_status: z.string().nullable().optional(),
      price_range: z
        .object({
          minimum_price: priced.optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  attributes: z
    .array(
      z.object({
        label: z.string(),
        code: z.string(),
      }),
    )
    .optional(),
});

export const magentoProduct = z.object({
  sku: z.string(),
  name: z.string(),
  url_key: z.string().nullable().optional(),
  stock_status: z.string().nullable().optional(),
  image,
  small_image: image,
  thumbnail: image,
  media_gallery: z
    .array(
      z.object({
        url: z.string().nullable().optional(),
        label: z.string().nullable().optional(),
      }),
    )
    .nullable()
    .optional(),
  price_range: z
    .object({
      minimum_price: priced.optional(),
      maximum_price: priced.optional(),
    })
    .nullable()
    .optional(),
  categories: z.array(z.object({ name: z.string() })).nullable().optional(),
  description: z.object({ html: z.string().nullable().optional() }).nullable().optional(),
  short_description: z.object({ html: z.string().nullable().optional() }).nullable().optional(),
  variants: z.array(magentoVariant).optional(),
});

export const magentoProductsResponse = z.object({
  data: z
    .object({
      products: z
        .object({
          total_count: z.number().optional(),
          page_info: z
            .object({
              current_page: z.number().optional(),
              page_size: z.number().optional(),
              total_pages: z.number().optional(),
            })
            .optional(),
          items: z.array(magentoProduct),
        })
        .optional(),
    })
    .optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

export type MagentoProduct = z.infer<typeof magentoProduct>;
export type MagentoVariant = z.infer<typeof magentoVariant>;
