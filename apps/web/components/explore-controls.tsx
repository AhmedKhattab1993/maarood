"use client";

import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { CategorySummary } from "@/lib/api/types";
import { categoryName } from "@/lib/categories";
import { invalidPriceRange, mergePriceParams, toNumber } from "@/lib/query";
import { useQueryParams } from "@/lib/use-query-params";
import { FilterChips } from "./filter-chips";
import { SortSelect } from "./sort-select";
import type { ProductSort } from "@/lib/api/types";

export function ExploreControls({
  categories,
  current,
  sort,
}: {
  categories: CategorySummary[];
  current: { category?: string; minPrice?: string; maxPrice?: string };
  sort?: ProductSort;
}) {
  return (
    <Suspense fallback={null}>
      <ExploreControlsInner categories={categories} current={current} sort={sort} />
    </Suspense>
  );
}

function ExploreControlsInner({
  categories,
  current,
  sort,
}: {
  categories: CategorySummary[];
  current: { category?: string; minPrice?: string; maxPrice?: string };
  sort?: ProductSort;
}) {
  const t = useTranslations("Filters");
  const tCat = useTranslations("Category");
  const { searchParams, pushParams } = useQueryParams();
  const [min, setMin] = useState(current.minPrice ?? "");
  const [max, setMax] = useState(current.maxPrice ?? "");
  // While a bound is focused it belongs to the typist — don't let URL
  // round-trips (chip removal, sibling commit) overwrite in-progress input.
  const editingRef = useRef<"min" | "max" | null>(null);

  useEffect(() => {
    if (editingRef.current !== "min") setMin(current.minPrice ?? "");
    if (editingRef.current !== "max") setMax(current.maxPrice ?? "");
  }, [current.minPrice, current.maxPrice]);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      pushParams(params, true);
    },
    [pushParams, searchParams],
  );

  // One commit pushes both bounds so the sibling's value is never lost.
  const commitPrices = useCallback(() => {
    pushParams(mergePriceParams(new URLSearchParams(searchParams.toString()), min, max), true);
  }, [pushParams, searchParams, min, max]);

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("page");
    pushParams(params);
  };

  const chips = [
    current.category
      ? {
          key: "category",
          label: categoryName(current.category, tCat),
        }
      : null,
    current.minPrice ? { key: "minPrice", label: `${current.minPrice}+` } : null,
    current.maxPrice ? { key: "maxPrice", label: `≤ ${current.maxPrice}` } : null,
  ].filter((c): c is { key: string; label: string } => c !== null);

  const invalid = invalidPriceRange(
    toNumber(current.minPrice),
    toNumber(current.maxPrice),
  );

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {categories.length > 0 && (
          <label className="flex min-w-40 flex-col gap-1 text-sm text-ink-black">
            {t("category")}
            <select
              value={current.category ?? ""}
              onChange={(e) => update("category", e.target.value)}
              className="border border-stone-grey bg-white px-2 py-1.5 text-sm outline-none focus:border-ink-black"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {categoryName(c.name, tCat)}
                </option>
              ))}
            </select>
          </label>
        )}
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm text-ink-black">{t("budget")}</legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              onFocus={() => (editingRef.current = "min")}
              onBlur={() => {
                editingRef.current = null;
                commitPrices();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPrices();
              }}
              placeholder={t("minPrice")}
              aria-label={t("minPrice")}
              className="w-28 border border-stone-grey bg-white px-2 py-1.5 text-sm outline-none focus:border-ink-black"
            />
            <span className="text-cool-grey">–</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              onFocus={() => (editingRef.current = "max")}
              onBlur={() => {
                editingRef.current = null;
                commitPrices();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPrices();
              }}
              placeholder={t("maxPrice")}
              aria-label={t("maxPrice")}
              className="w-28 border border-stone-grey bg-white px-2 py-1.5 text-sm outline-none focus:border-ink-black"
            />
          </div>
        </fieldset>
        <SortSelect current={sort} />
      </div>
      <FilterChips
        items={chips}
        onRemove={(key) => update(key, "")}
        onClearAll={clearAll}
      />
      {invalid && (
        <p role="alert" className="text-sm text-alert-red">
          {t("invalidRange")}
        </p>
      )}
    </div>
  );
}
