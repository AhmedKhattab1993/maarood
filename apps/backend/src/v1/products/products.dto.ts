/** Shared query params for product list & search endpoints. */

import { z } from 'zod';

function merchantIdList(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parts = Array.isArray(value) ? value : String(value).split(',');
  const ids = parts.map((s) => String(s).trim()).filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

export const productQuery = z.object({
  brand: z.string().trim().optional(),
  merchantId: z.preprocess(merchantIdList, z.array(z.string().uuid()).optional()),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  availability: z.enum(['in_stock', 'out_of_stock', 'unknown']).optional(),
  color: z.string().trim().optional(),
  size: z.string().trim().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'relevance']).default('newest'),
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(60).default(24),
});

export type ProductQuery = z.infer<typeof productQuery>;
