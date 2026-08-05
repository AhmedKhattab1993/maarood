"use client";

import { useTranslations } from "next-intl";
import { useQueryParams } from "@/lib/use-query-params";
import { Suspense, useCallback, useMemo } from "react";

/** Simple page-based pagination. Backend limit maxes at 60 (products.dto.ts). */
export function Pagination({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  if (pageCount <= 1) return null;

  return (
    <Suspense fallback={null}>
      <PaginationInner page={page} pageCount={pageCount} />
    </Suspense>
  );
}

function PaginationInner({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  const t = useTranslations("State");
  const { searchParams, pushParams } = useQueryParams();

  const goto = useCallback(
    (target: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(target));
      pushParams(params);
    },
    [pushParams, searchParams],
  );

  const pages = useMemo(() => window(page, pageCount), [page, pageCount]);

  return (
    <nav aria-label={t("loading")} className="flex items-center justify-center gap-1 py-8">
      <PagerButton disabled={page <= 1} onClick={() => goto(page - 1)}>
        ‹
      </PagerButton>
      {pages.map((p) =>
        p === "…" ? (
          <span key={`gap-${p}-${Math.random()}`} className="px-2 text-cool-grey">
            …
          </span>
        ) : (
          <PagerButton key={p} active={p === page} onClick={() => goto(p)}>
            {p}
          </PagerButton>
        ),
      )}
      <PagerButton disabled={page >= pageCount} onClick={() => goto(page + 1)}>
        ›
      </PagerButton>
    </nav>
  );
}

function PagerButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`min-w-9 rounded-default border px-2.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-ink-black bg-ink-black text-white"
          : "border-stone-grey bg-white text-ink-black hover:bg-stone-grey"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

/** Compact page window: first, last, and a window around the current page. */
function window(page: number, pageCount: number): Array<number | "…"> {
  const out: Array<number | "…"> = [];
  const push = (n: number | "…") => out.push(n);
  const span = 1;
  const start = Math.max(2, page - span);
  const end = Math.min(pageCount - 1, page + span);

  push(1);
  if (start > 2) push("…");
  for (let p = start; p <= end; p++) push(p);
  if (end < pageCount - 1) push("…");
  if (pageCount > 1) push(pageCount);
  return out;
}
