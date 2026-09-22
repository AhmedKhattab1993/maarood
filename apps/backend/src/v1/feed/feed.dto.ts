import { z } from 'zod';
import { productQuery } from '../products/products.dto';

const weight = z.number().finite().min(0).max(100);
const categoryWeights = z.record(z.string().trim().min(1).max(100), weight)
  .refine((entries) => Object.keys(entries).length <= 64, 'At most 64 category preferences');
const merchantWeights = z.record(z.string().uuid(), weight)
  .refine((entries) => Object.keys(entries).length <= 100, 'At most 100 merchant preferences');

export const feedProfile = z.object({
  categories: categoryWeights.default({}),
  merchants: merchantWeights.default({}),
}).strict();

/**
 * The client freezes these inputs for an infinite-scroll session, then sends a
 * new seed and updated preferences/seen IDs when the shopper refreshes.
 * POST keeps this private, bounded preference payload out of URLs and caches.
 */
export const feedRequest = z.object({
  seed: z.string().trim().min(1).max(120),
  page: z.number().int().positive().max(10000).default(1),
  limit: z.number().int().positive().max(60).default(24),
  query: productQuery.default({}),
  profile: feedProfile.default({}),
  seenIds: z.array(z.string().uuid()).max(300).default([]),
}).strict();

export type FeedProfile = z.infer<typeof feedProfile>;
export type FeedRequest = z.infer<typeof feedRequest>;

/** Timestamped seeds keep newly saved/followed signals out of later pages. */
export function preferenceSnapshot(seed: string): Date | null {
  const timestamp = /^(\d{13}):/.exec(seed)?.[1];
  if (!timestamp) return null;
  const milliseconds = Number(timestamp);
  if (milliseconds < Date.UTC(2000, 0, 1) || milliseconds > Date.now() + 60_000) return null;
  return new Date(milliseconds);
}
