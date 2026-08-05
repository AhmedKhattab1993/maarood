"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Query-param navigation for client components (sort / filter / pagination).
 *
 * Uses Next.js's native primitives rather than next-intl's: next-intl's
 * `usePathname` returns the declared route *template* (e.g. `/c/[category]`),
 * so feeding it back into its `router.push` emits the literal `[category]`
 * token and 404s. Next.js's `usePathname` returns the concrete path
 * (e.g. `/en/c/apparel`), which we can push to directly — query updates never
 * change the locale, so locale-aware routing isn't needed here.
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Push a new query string, optionally resetting to the first page. */
  const pushParams = useCallback(
    (params: URLSearchParams, resetPage = false) => {
      if (resetPage) params.delete("page");
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.push(href);
    },
    [pathname, router],
  );

  return { searchParams, pathname, pushParams };
}
