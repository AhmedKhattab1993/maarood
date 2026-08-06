"use client";

import { useTranslations } from "next-intl";
import { useQueryParams } from "@/lib/use-query-params";
import {
  Suspense,
  useCallback,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { BrandSummary, CategorySummary } from "@/lib/api/types";
import { categoryName } from "@/lib/categories";

/**
 * Nike-style filter controls. Owns the query-param mutation logic and renders:
 *  - a borderless "Show Filters"/"Hide Filters" toggle (placed in the wall-header)
 *  - the facet list (placed in the rail/drawer by the caller)
 *
 * The caller (product-listing) owns the `open` state so it can place the toggle
 * and the rail in different layout regions.
 */
export function FilterBar({
  brands,
  categories,
  current,
  open,
  onToggle,
}: {
  brands: BrandSummary[];
  categories: CategorySummary[];
  current: Record<string, string | undefined>;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Suspense fallback={null}>
      <FilterBarInner
        brands={brands}
        categories={categories}
        current={current}
        open={open}
        onToggle={onToggle}
      />
    </Suspense>
  );
}

function FilterBarInner({
  brands,
  categories,
  current,
  open,
  onToggle,
}: {
  brands: BrandSummary[];
  categories: CategorySummary[];
  current: Record<string, string | undefined>;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Filters");
  const tCat = useTranslations("Category");
  const { searchParams, pushParams } = useQueryParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      pushParams(params, true);
    },
    [pushParams, searchParams],
  );

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    const q = params.get("q");
    const kept = new URLSearchParams();
    if (q) kept.set("q", q);
    pushParams(kept);
  };

  const activeCount =
    (current.brand ? 1 : 0) +
    (current.category ? 1 : 0) +
    (current.minPrice ? 1 : 0) +
    (current.maxPrice ? 1 : 0) +
    (current.color ? 1 : 0) +
    (current.size ? 1 : 0) +
    (current.availability ? 1 : 0);

  return (
    <>
      {/* Desktop rail */}
      {open && (
        <aside className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-20 flex flex-col gap-4">
            <FilterHeader onClear={clearAll} showClear={activeCount > 0} />
            <FacetList
              brands={brands}
              categories={categories}
              current={current}
              update={update}
              tCat={tCat}
            />
          </div>
        </aside>
      )}

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={t("hideFilters")}
            onClick={onToggle}
            className="absolute inset-0 bg-ink-black/40"
          />
          <div className="absolute inset-y-0 start-0 flex w-[85%] max-w-sm flex-col gap-5 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <FilterHeader onClear={clearAll} showClear={activeCount > 0} />
              <button
                type="button"
                aria-label={t("hideFilters")}
                onClick={onToggle}
                className="text-cool-grey hover:text-ink-black"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FacetList
                brands={brands}
                categories={categories}
                current={current}
                update={update}
                tCat={tCat}
              />
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="border border-ink-black bg-ink-black px-4 py-2.5 text-sm font-medium text-white"
            >
              {t("apply")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterHeader({
  onClear,
  showClear,
}: {
  onClear: () => void;
  showClear: boolean;
}) {
  const t = useTranslations("Filters");
  return (
    <div className="flex items-center justify-between border-b border-stone-grey pb-3">
      <h2 className="text-base font-medium text-ink-black">{t("title")}</h2>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-maaroud-blue hover:underline"
        >
          {t("clear")}
        </button>
      )}
    </div>
  );
}

function FacetList({
  brands,
  categories,
  current,
  update,
  tCat,
}: {
  brands: BrandSummary[];
  categories: CategorySummary[];
  current: Record<string, string | undefined>;
  update: (key: string, value: string) => void;
  tCat: (key: string) => string;
}) {
  const t = useTranslations("Filters");
  return (
    <div className="flex flex-col divide-y divide-stone-grey">
      {brands.length > 0 && (
        <Facet label={t("brand")}>
          <Select
            value={current.brand ?? ""}
            onChange={(e) => update("brand", e.target.value)}
            options={[
              { value: "", label: "—" },
              ...brands.map((b) => ({ value: b.slug, label: b.name })),
            ]}
          />
        </Facet>
      )}
      {categories.length > 0 && (
        <Facet label={t("category")}>
          <Select
            value={current.category ?? ""}
            onChange={(e) => update("category", e.target.value)}
            options={[
              { value: "", label: "—" },
              ...categories.map((c) => ({
                value: c.name,
                label: categoryName(c.name, tCat),
              })),
            ]}
          />
        </Facet>
      )}
      <Facet label={t("price")}>
        <div className="flex items-center gap-2">
          <NumberField
            value={current.minPrice ?? ""}
            onChange={(e) => update("minPrice", e.target.value)}
            placeholder="0"
          />
          <span className="text-cool-grey">–</span>
          <NumberField
            value={current.maxPrice ?? ""}
            onChange={(e) => update("maxPrice", e.target.value)}
            placeholder="∞"
          />
        </div>
      </Facet>
      <Facet label={t("availability")}>
        <Select
          value={current.availability ?? ""}
          onChange={(e) => update("availability", e.target.value)}
          options={[
            { value: "", label: "—" },
            { value: "in_stock", label: t("in_stock") },
            { value: "out_of_stock", label: t("out_of_stock") },
            { value: "unknown", label: t("unknown") },
          ]}
        />
      </Facet>
      <Facet label={t("color")}>
        <TextField
          value={current.color ?? ""}
          onChange={(e) => update("color", e.target.value)}
        />
      </Facet>
      <Facet label={t("size")}>
        <TextField
          value={current.size ?? ""}
          onChange={(e) => update("size", e.target.value)}
        />
      </Facet>
    </div>
  );
}

/** A collapsible facet section. Native <details> keeps it JS-free and RTL-safe. */
function Facet({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-stone-grey py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium text-ink-black">
        {label}
        <span className="text-cool-grey transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </details>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-stone-grey bg-white px-2 py-1.5 text-sm text-ink-black outline-none focus:border-ink-black"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-stone-grey bg-white px-2 py-1.5 text-sm text-ink-black outline-none focus:border-ink-black"
    />
  );
}

function NumberField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-stone-grey bg-white px-2 py-1.5 text-sm text-ink-black outline-none focus:border-ink-black"
    />
  );
}
