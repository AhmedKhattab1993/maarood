"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", e.target.value);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <label className="flex items-center gap-2 text-sm text-cool-grey">
      <span className="hidden sm:inline">{t("label")}</span>
      <select
        value={current}
        onChange={onChange}
        aria-label={t("label")}
        className="rounded-default border border-stone-grey bg-white px-2 py-1.5 text-sm text-ink-black outline-none focus:border-maaroud-blue"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </select>
    </label>
  );
}
