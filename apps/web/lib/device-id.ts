"use client";

/**
 * Anonymous device id used as `X-Device-Id` for the saved-products endpoints.
 *
 * The backend requires a valid UUID (DeviceIdGuard). We generate one per
 * browser and persist it in localStorage. There is no user account in the MVP —
 * saved products are tied to this anonymous id (see 01:44 / 08:135-138).
 */

const STORAGE_KEY = "maarood.device-id";
const COOKIE_KEY = "maarood_device_id";

function isValidUuid(value: string | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(value: string): void {
  if (typeof document === "undefined") return;
  // 10 years — effectively permanent for an anonymous device id.
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; max-age=315360000; path=/; SameSite=Lax`;
}

/** Generate a fresh RFC-4122 v4 UUID (crypto.randomUUID with manual fallback). */
function createUuid(): string {
  const c: Crypto = crypto;
  if (typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  // Manual fallback (older browsers).
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(
    6,
    8,
  ).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

/**
 * Returns the persisted device id, creating one if none exists yet. Always a
 * valid UUID. Server-side rendering returns null; call this from a client
 * component or effect.
 */
export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;

  const fromStorage = window.localStorage.getItem(STORAGE_KEY);
  if (isValidUuid(fromStorage)) {
    // Ensure cookie is also set (so a future SSR saved page can read it).
    writeCookie(fromStorage);
    return fromStorage;
  }

  const fromCookie = readCookie();
  if (isValidUuid(fromCookie)) {
    window.localStorage.setItem(STORAGE_KEY, fromCookie);
    return fromCookie;
  }

  const created = createUuid();
  window.localStorage.setItem(STORAGE_KEY, created);
  writeCookie(created);
  return created;
}

/** Read the device id from a cookie on the server (Next.js cookies() API). */
export function getDeviceIdFromCookie(cookieValue: string | undefined): string | null {
  return isValidUuid(cookieValue ?? null) ? (cookieValue as string) : null;
}
