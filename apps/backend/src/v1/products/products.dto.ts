/** Shared query params for product list & search endpoints. */

import { z } from 'zod';

export const productQuery = z.object({
  brand: z.string().trim().optional(),
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
