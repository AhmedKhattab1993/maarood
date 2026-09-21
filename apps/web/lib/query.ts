import type { Availability, ProductSort } from "./api/types";

export function toNumber(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string" || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "relevance"];

export function toSort(v: string | string[] | undefined): ProductSort | undefined {
  const s = typeof v === "string" ? (v as ProductSort) : undefined;
  return s && SORTS.includes(s) ? s : undefined;
}

const AVAIL: Availability[] = ["in_stock", "out_of_stock", "unknown"];

export function toAvailability(
  v: string | string[] | undefined,
): Availability | undefined {
  const s = typeof v === "string" ? (v as Availability) : undefined;
  return s && AVAIL.includes(s) ? s : undefined;
}

/** True when both bounds are set and min is greater than max. Do not swap. */
export function invalidPriceRange(
  min: number | undefined,
  max: number | undefined,
): boolean {
  return min !== undefined && max !== undefined && min > max;
}

/**
 * Write both budget bounds onto one set of params for a single commit, so
 * committing one field never discards the value typed into the other.
 * Empty (or blank) values remove their bound.
 */
export function mergePriceParams(
  params: URLSearchParams,
  min: string,
  max: string,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const minTrimmed = min.trim();
  const maxTrimmed = max.trim();
  if (minTrimmed) next.set("minPrice", minTrimmed);
  else next.delete("minPrice");
  if (maxTrimmed) next.set("maxPrice", maxTrimmed);
  else next.delete("maxPrice");
  return next;
}
