"use client";

import { getDeviceId } from "./device-id";
import type { SavedProduct } from "./api/types";
import { ApiError, type ApiErrorBody } from "./api/types";

const CLIENT_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

async function savedFetch(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const deviceId = getDeviceId();
  if (!deviceId) {
    throw new ApiError(400, {
      error: { code: "bad_request", message: "Device id unavailable" },
    });
  }
  const res = await fetch(`${CLIENT_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
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
