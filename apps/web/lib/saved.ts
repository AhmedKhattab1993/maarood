"use client";

import type { SavedProduct } from "./api/types";
import { ApiError, type ApiErrorBody } from "./api/types";
import { publicBackendUrl } from "./api/backend-url";
import { getAuthToken } from "./auth";

async function savedFetch(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError(401, {
      error: { code: "unauthorized", message: "Sign in required" },
    });
  }
  const res = await fetch(`${publicBackendUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let body: ApiErrorBody;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = { error: { code: "error", message: res.statusText } };
    }
    throw new ApiError(res.status, body);
  }
  return res;
}

let savedInflight: Promise<SavedProduct[]> | null = null;

export function invalidateSaved(): void {
  savedInflight = null;
}

export async function listSaved(): Promise<SavedProduct[]> {
  if (!savedInflight) {
    savedInflight = savedFetch("/v1/saved", { method: "GET" }).then(
      (res) => res.json() as Promise<SavedProduct[]>,
    );
  }
  return savedInflight;
}

export function savedProductIds(items: readonly SavedProduct[]): string[] {
  return items.map((item) => item.product.id);
}

/**
 * Whether this product should render as saved. Favourites pass initialSaved;
 * feed/details hydrate from listSaved ids. Used by SaveButton so the first
 * click unsaves when the item is already saved.
 */
export function isProductSaved(
  productId: string,
  options: {
    initialSaved?: boolean;
    savedIds?: readonly string[] | ReadonlySet<string> | null;
  } = {},
): boolean {
  if (options.initialSaved) return true;
  const ids = options.savedIds;
  if (!ids) return false;
  if (ids instanceof Set) return ids.has(productId);
  return ids.includes(productId);
}

/** Save a product. Idempotent — returns true on 201. */
export async function saveProduct(productId: string): Promise<boolean> {
  await savedFetch(`/v1/saved/${encodeURIComponent(productId)}`, {
    method: "POST",
  });
  invalidateSaved();
  return true;
}

/** Remove a saved product. No error if it wasn't saved. */
export async function unsaveProduct(productId: string): Promise<boolean> {
  await savedFetch(`/v1/saved/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
  invalidateSaved();
  return true;
}
