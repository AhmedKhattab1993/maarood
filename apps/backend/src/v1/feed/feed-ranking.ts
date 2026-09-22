import { inArray, sql, type SQL } from 'drizzle-orm';
import { products } from '@maarood/schema';
import type { FeedProfile } from './feed.dto';

function normalizedWeights(weights: Record<string, number>): Record<string, number> {
  const entries = Object.entries(weights).filter(([, value]) => value > 0);
  const maximum = Math.max(1, ...entries.map(([, value]) => value));
  return Object.fromEntries(entries.map(([key, value]) => [key.toLowerCase(), value / maximum]));
}

/**
 * A seeded weighted shuffle, evaluated in PostgreSQL before LIMIT/OFFSET.
 * Every product keeps a nonzero exploration chance; category/merchant affinity
 * raises its odds rather than pinning preferred products permanently on top.
 * Two slots per merchant per round prevent a large catalog taking over a page.
 */
export function feedOrderBy(seed: string, profile: FeedProfile, seenIds: string[]): SQL[] {
  const categories = JSON.stringify(normalizedWeights(profile.categories));
  const merchants = JSON.stringify(normalizedWeights(profile.merchants));
  const weight = sql`(1.0
    + 3.0 * coalesce((${categories}::jsonb ->> lower(${products.category}))::double precision, 0)
    + 1.5 * coalesce((${merchants}::jsonb ->> ${products.merchantId}::text)::double precision, 0))`;
  // MD5 is used only as a deterministic shuffle, never for authentication.
  // The open interval (0, 1) avoids ln(0) and makes every key finite.
  const uniform = sql`((('x' || substr(md5(${seed} || ':' || ${products.id}::text), 1, 8))::bit(32)::bigint + 1)::double precision / 4294967297.0)`;
  const priority = sql`(-ln(${uniform}) / ${weight})`;
  const seen = seenIds.length > 0
    ? sql`case when ${inArray(products.id, [...new Set(seenIds)])} then 1 else 0 end`
    : sql`0::integer`;
  const merchantRound = sql`floor((row_number() over (
    partition by ${products.merchantId}
    order by ${seen}, ${priority}, ${products.id}
  ) - 1) / 2.0)`;

  // The UUID tie-breaker makes pagination deterministic even on hash collisions.
  return [sql`${seen} asc`, sql`${merchantRound} asc`, sql`${priority} asc`, sql`${products.id} asc`];
}
