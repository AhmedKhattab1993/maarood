import "server-only";

import type {
  BrandDetailResponse,
  BrandSummary,
  CatalogFacets,
  CategorySummary,
  PaginatedResult,
  ProductQuery,
  PublicProduct,
  SavedProduct,
  SearchResult,
} from "./types";
import { ApiError, NotFoundError, type ApiErrorBody } from "./types";
import { serverBackendUrl } from "./backend-url";

/**
 * Base URL of the backend as seen from the server (Next.js Server Components).
 * Client-side calls use NEXT_PUBLIC_BACKEND_URL via publicBackendUrl().
 */
function serverBase(): string {
  return serverBackendUrl();
}

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

async function fetchJson<T>(pathAndQuery: string, init?: RequestInit): Promise<T> {
  const url = `${serverBase()}${pathAndQuery}`;
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    // Revalidate list pages reasonably often; product detail is revalidated per-route.
    next: { revalidate: 60, ...(init?.next ?? {}) },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // Non-JSON error (e.g. proxy 502). Synthesize a minimal envelope.
      body = { error: { code: "error", message: res.statusText } };
    }
    if (res.status === 404) throw new NotFoundError(body.error.message);
    throw new ApiError(res.status, body);
  }

  return (await res.json()) as T;
}

function productQueryParams(q: ProductQuery = {}): Record<string, unknown> {
  return { ...q };
}

// --- Public read endpoints -------------------------------------------------

export async function getProducts(
  query: ProductQuery = {},
): Promise<PaginatedResult<PublicProduct>> {
  return fetchJson<PaginatedResult<PublicProduct>>(
    `/v1/products${buildSearchParams(productQueryParams(query))}`,
  );
}

export async function getProduct(id: string): Promise<PublicProduct> {
  return fetchJson<PublicProduct>(`/v1/products/${encodeURIComponent(id)}`);
}

export async function getBrands(category?: string): Promise<BrandSummary[]> {
  return fetchJson<BrandSummary[]>(
    `/v1/brands${buildSearchParams({ category })}`,
  );
}

export async function getBrand(
  slug: string,
  query: ProductQuery = {},
): Promise<BrandDetailResponse> {
  return fetchJson<BrandDetailResponse>(
    `/v1/brands/${encodeURIComponent(slug)}${buildSearchParams(
      productQueryParams(query),
    )}`,
  );
}

export async function getCategories(brand?: string): Promise<CategorySummary[]> {
  return fetchJson<CategorySummary[]>(
    `/v1/categories${buildSearchParams({ brand })}`,
  );
}

export async function getFacets(query: {
  brand?: string;
  category?: string;
} = {}): Promise<CatalogFacets> {
  return fetchJson<CatalogFacets>(`/v1/facets${buildSearchParams(query)}`);
}

export async function searchProducts(
  q: string,
  query: ProductQuery = {},
): Promise<SearchResult> {
  const params = { ...productQueryParams(query), q };
  return fetchJson<SearchResult>(`/v1/search${buildSearchParams(params)}`);
}

/**
 * The outbound-click / redirect endpoint. Server-side prefetch not useful here —
 * the browser follows the 302. Exposed for building hrefs (see components).
 */
export function redirectHref(productId: string): string {
  return `${serverBase()}/v1/products/${encodeURIComponent(productId)}/redirect`;
}

/**
 * Server-side helper to record an outbound click then return the destination.
 * Currently the redirect endpoint is a 302; this is reserved for a future
 * route-handler indirection if we want server-side attribution before redirect.
 */
export async function getRedirectDestination(
  productId: string,
): Promise<string> {
  // We don't use fetchJson because the response is a 302 with no JSON body.
  const res = await fetch(redirectHref(productId), {
    redirect: "manual",
    headers: { Accept: "text/html,application/json" },
  });
  const location = res.headers.get("location");
  if (!location) {
    throw new ApiError(res.status, {
      error: { code: "error", message: "No redirect destination" },
    });
  }
  return location;
}

// --- Saved products (server-side read with explicit device id) -------------
// The browser owns the device id; for SSR of the Saved page we still need the
// header, so this helper takes it explicitly. Client mutations live in
// lib/saved.ts.

export async function getSavedServer(
  deviceId: string,
): Promise<SavedProduct[]> {
  return fetchJson<SavedProduct[]>(`/v1/saved`, {
    headers: { "X-Device-Id": deviceId },
  });
}
