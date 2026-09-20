import { publicBackendUrl } from "./backend-url";
import { ApiError, NotFoundError, type ApiErrorBody } from "./types";
import type {
  BrandDetailResponse,
  BrandSummary,
  PaginatedResult,
  ProductQuery,
  PublicProduct,
  SearchResult,
} from "./types";

function buildSearchParams(query: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        sp.append(key, String(item));
      }
      continue;
    }
    sp.set(key, String(value));
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}

async function fetchJson<T>(pathAndQuery: string): Promise<T> {
  const res = await fetch(`${publicBackendUrl()}${pathAndQuery}`, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = { error: { code: "error", message: res.statusText } };
    }
    if (res.status === 404) throw new NotFoundError(body.error.message);
    throw new ApiError(res.status, body);
  }

  return (await res.json()) as T;
}

export async function publicGetProducts(
  query: ProductQuery = {},
): Promise<PaginatedResult<PublicProduct>> {
  return fetchJson<PaginatedResult<PublicProduct>>(
    `/v1/products${buildSearchParams({ ...query })}`,
  );
}

export async function publicSearchProducts(
  q: string,
  query: ProductQuery = {},
): Promise<SearchResult> {
  return fetchJson<SearchResult>(
    `/v1/search${buildSearchParams({ ...query, q })}`,
  );
}

export async function publicGetBrand(
  slug: string,
  query: ProductQuery = {},
): Promise<BrandDetailResponse> {
  return fetchJson<BrandDetailResponse>(
    `/v1/brands/${encodeURIComponent(slug)}${buildSearchParams({ ...query })}`,
  );
}

export async function publicGetBrands(): Promise<BrandSummary[]> {
  return fetchJson<BrandSummary[]>(`/v1/brands`);
}

export type DiscoverySource =
  | { kind: "products"; query: ProductQuery }
  | { kind: "search"; q: string; query: ProductQuery }
  | { kind: "brand"; slug: string; query: ProductQuery };

export async function publicFetchDiscoveryPage(
  source: DiscoverySource,
  page: number,
): Promise<PaginatedResult<PublicProduct>> {
  const query = { ...source.query, page };
  if (source.kind === "search") {
    const result = await publicSearchProducts(source.q, query);
    return result;
  }
  if (source.kind === "brand") {
    const result = await publicGetBrand(source.slug, query);
    return result.products;
  }
  return publicGetProducts(query);
}
