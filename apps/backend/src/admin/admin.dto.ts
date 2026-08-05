/** Input validation for admin endpoints. */

import { z } from 'zod';

export const createMerchantBody = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  domain: z.string().trim().min(1),
  connectorType: z.string().trim().min(1),
  crawlFrequencyMinutes: z.number().int().positive().optional(),
});

export type CreateMerchantBody = z.infer<typeof createMerchantBody>;

export const updateMerchantBody = z.object({
  optedOut: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  crawlFrequencyMinutes: z.number().int().positive().optional(),
});

export type UpdateMerchantBody = z.infer<typeof updateMerchantBody>;
