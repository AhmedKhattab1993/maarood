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

export async function listSaved(): Promise<SavedProduct[]> {
  const res = await savedFetch("/v1/saved", { method: "GET" });
  return (await res.json()) as SavedProduct[];
}

/** Save a product. Idempotent — returns true on 201. */
export async function saveProduct(productId: string): Promise<boolean> {
  await savedFetch(`/v1/saved/${encodeURIComponent(productId)}`, {
    method: "POST",
  });
  return true;
}

/** Remove a saved product. No error if it wasn't saved. */
export async function unsaveProduct(productId: string): Promise<boolean> {
  await savedFetch(`/v1/saved/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
  return true;
}
