import { createNavigation } from "next-intl/navigation";
import { locales } from "./config";

/**
 * Locale-aware navigation primitives.
 *
 * `pathnames` declares every route (including dynamic segments) so next-intl
 * can interpolate `[param]` from `query`. Without this, a dynamic href like
 * `/brands/[slug]` is emitted literally and Next.js rejects it.
 *
 * Routes are identical in both locales — we localize content, not segments.
 */
const pathnames = {
  "/": "/",
  "/search": "/search",
  "/brands": "/brands",
  "/brands/[slug]": "/brands/[slug]",
  "/p/[id]": "/p/[id]",
  "/c/[category]": "/c/[category]",
  "/saved": "/saved",
} as const;

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales: [...locales],
    pathnames,
  });

/**
 * Build a navigation target for `router.push` from the current pathname plus a
 * URLSearchParams. The typed next-intl router doesn't accept a raw query-string,
 * so we pass `{ pathname, query }` with the params as a plain record. `pathname`
 * is cast because the typed union from usePathname() can't be expressed here
 * without generics; the value is always a real declared pathname at runtime.
 */
export function toHref(
  pathname: string,
  params: URLSearchParams,
): { pathname: never; query: Record<string, string> } {
  const query: Record<string, string> = {};
  params.forEach((value, key) => {
    query[key] = value;
  });
  return { pathname: pathname as never, query };
}
