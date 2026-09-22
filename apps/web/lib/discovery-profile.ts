import { getAuthToken } from './auth';

export type InterestProduct = { id: string; merchantId: string; category: string };
export type DiscoveryProfile = {
  categories: Record<string, number>;
  merchants: Record<string, number>;
};
export type DiscoveryHistory = DiscoveryProfile & {
  updatedAt: number;
  seen: { id: string; at: number }[];
};

const DAY = 86_400_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CATEGORIES = new Set(['apparel', 'footwear', 'accessories', 'bags', 'jewelry', 'other']);
const recentViews = new Map<string, number>();

/** Account ids only partition local history; the API verifies the full token. */
export function discoveryIdentity(token: string | null): string {
  const id = token?.split('.')[0];
  return id && UUID.test(id) ? id : 'guest';
}

function storageKey(): string {
  return `maarood.discovery.v1:${discoveryIdentity(getAuthToken())}`;
}

function cleanScores(
  value: unknown,
  valid: (key: string) => boolean,
  decay: number,
): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, score]) =>
          valid(key) && typeof score === 'number' && Number.isFinite(score) && score > 0,
      )
      .map(([key, score]) => [key, Math.min(20, Number(score)) * decay] as const)
      .filter(([, score]) => score >= 0.1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 32),
  );
}

/** Discard corrupt/expired storage and decay older interests rather than locking in a taste. */
export function normalizeDiscoveryHistory(value: unknown, now = Date.now()): DiscoveryHistory {
  const raw = value && typeof value === 'object' ? (value as Partial<DiscoveryHistory>) : {};
  const age =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? Math.max(0, now - raw.updatedAt)
      : 30 * DAY;
  const decay = age >= 30 * DAY ? 0 : Math.pow(0.9, age / DAY);
  const unique = new Map<string, { id: string; at: number }>();
  if (Array.isArray(raw.seen)) {
    for (const entry of raw.seen) {
      if (
        entry &&
        typeof entry.id === 'string' &&
        UUID.test(entry.id) &&
        typeof entry.at === 'number' &&
        Number.isFinite(entry.at) &&
        entry.at <= now &&
        entry.at > now - 7 * DAY
      ) {
        if (!unique.has(entry.id) || unique.get(entry.id)!.at < entry.at)
          unique.set(entry.id, entry);
      }
    }
  }
  return {
    updatedAt: now,
    categories: cleanScores(raw.categories, (key) => CATEGORIES.has(key), decay),
    merchants: cleanScores(raw.merchants, (key) => UUID.test(key), decay),
    seen: [...unique.values()].sort((a, b) => b.at - a.at).slice(0, 300),
  };
}

export function addProductInterest(
  history: DiscoveryHistory,
  product: InterestProduct,
  now = Date.now(),
): DiscoveryHistory {
  const next = normalizeDiscoveryHistory(history, now);
  if (CATEGORIES.has(product.category))
    next.categories[product.category] = Math.min(20, (next.categories[product.category] ?? 0) + 2);
  if (UUID.test(product.merchantId))
    next.merchants[product.merchantId] = Math.min(
      20,
      (next.merchants[product.merchantId] ?? 0) + 3,
    );
  return normalizeDiscoveryHistory(next, now);
}

export function addSeenProducts(
  history: DiscoveryHistory,
  ids: string[],
  now = Date.now(),
): DiscoveryHistory {
  return normalizeDiscoveryHistory(
    { ...history, seen: [...ids.map((id) => ({ id, at: now })), ...history.seen] },
    now,
  );
}

export function readDiscoveryHistory(): DiscoveryHistory {
  try {
    return normalizeDiscoveryHistory(
      JSON.parse(window.localStorage.getItem(storageKey()) ?? 'null'),
    );
  } catch {
    return normalizeDiscoveryHistory(null);
  }
}

function writeHistory(history: DiscoveryHistory): void {
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(history));
  } catch {
    // Private browsing and a full storage quota must never break discovery.
  }
}

export function recordProductInterest(product: InterestProduct): void {
  const key = `${storageKey()}:${product.id}`;
  const now = Date.now();
  if (now - (recentViews.get(key) ?? 0) < 120_000) return;
  recentViews.set(key, now);
  if (recentViews.size > 100) recentViews.delete(recentViews.keys().next().value!);
  writeHistory(addProductInterest(readDiscoveryHistory(), product, now));
}

export function recordSeenProducts(ids: string[]): void {
  writeHistory(addSeenProducts(readDiscoveryHistory(), ids));
}
