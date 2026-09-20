/** Matches production crawl cadence (Vercel cron every 6 hours). Missing/stale checks are unconfirmed, never in_stock. */
export const AVAILABILITY_FRESHNESS_HOURS = 6;
export const AVAILABILITY_FRESHNESS_MS = AVAILABILITY_FRESHNESS_HOURS * 60 * 60 * 1000;

export type StoredAvailability = 'in_stock' | 'out_of_stock' | 'unknown';

function isFresh(
  checkedAt: Date | null,
  now: Date,
  freshnessMs: number,
): boolean {
  if (checkedAt == null) return false;
  const t = checkedAt.getTime();
  if (Number.isNaN(t)) return false;
  return now.getTime() - t < freshnessMs;
}

export function resolveAvailability(
  stored: StoredAvailability,
  checkedAt: Date | null,
  now: Date = new Date(),
  freshnessMs: number = AVAILABILITY_FRESHNESS_MS,
): StoredAvailability {
  if (!isFresh(checkedAt, now, freshnessMs)) return 'unknown';
  return stored;
}

export function isConfirmedOutOfStock(
  stored: StoredAvailability,
  checkedAt: Date | null,
  now: Date = new Date(),
  freshnessMs: number = AVAILABILITY_FRESHNESS_MS,
): boolean {
  return resolveAvailability(stored, checkedAt, now, freshnessMs) === 'out_of_stock';
}

export function isConfirmedInStock(
  stored: StoredAvailability,
  checkedAt: Date | null,
  now: Date = new Date(),
  freshnessMs: number = AVAILABILITY_FRESHNESS_MS,
): boolean {
  return resolveAvailability(stored, checkedAt, now, freshnessMs) === 'in_stock';
}
