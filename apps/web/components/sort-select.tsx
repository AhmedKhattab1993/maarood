"use client";

import { useTranslations } from "next-intl";
import { useQueryParams } from "@/lib/use-query-params";
import { Suspense, useCallback, type ChangeEvent } from "react";
import type { ProductSort } from "@/lib/api/types";

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "relevance"];

export function SortSelect({ current = "newest" }: { current?: ProductSort }) {
  return (
    <Suspense fallback={null}>
      <SortSelectInner current={current} />
    </Suspense>
  );
}

function SortSelectInner({ current }: { current: ProductSort }) {
  const t = useTranslations("Sort");
  const { searchParams, pushParams } = useQueryParams();

  const onChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", e.target.value);
      pushParams(params, true);
    },
    [pushParams, searchParams],
  );

  return (
    <label className="flex items-center gap-1 text-sm font-medium text-ink-black">
      <span>{t("label")}</span>
      <select
        value={current}
        onChange={onChange}
        aria-label={t("label")}
        className="cursor-pointer appearance-none bg-transparent pr-4 text-sm font-medium text-ink-black outline-none"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </select>
      <span aria-hidden className="-ms-4 pointer-events-none text-ink-black">
        ▾
      </span>
    </label>
  );
}
