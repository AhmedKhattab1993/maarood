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
