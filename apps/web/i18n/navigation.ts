import { createNavigation } from "next-intl/navigation";
import { locales } from "./config";

/**
 * Locale-aware navigation primitives. Dynamic routes use the standard Next.js
 * href form `{ pathname: '/x/[slug]', query: { slug } }` (query, not params);
 * Next interpolates the `[slug]` segment from `query`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales: [...locales],
  });
