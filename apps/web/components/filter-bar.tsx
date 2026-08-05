"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, type ChangeEvent } from "react";
import type { BrandSummary, CategorySummary } from "@/lib/api/types";

/**
 * Filter + sort bar. Builds query params by merging the current search params
 * with the changed filter, then navigates. Each control is a real form input so
 * the page degrades without JS (the listing pages also read the same params
 * server-side).
 */
export function FilterBar({
  brands,
  categories,
  current,
}: {
  brands: BrandSummary[];
  categories: CategorySummary[];
  current: Record<string, string | undefined>;
}) {
  return (
    <Suspense fallback={null}>
      <FilterBarInner brands={brands} categories={categories} current={current} />
    </Suspense>
  );
}

function FilterBarInner({
  brands,
  categories,
  current,
}: {
  brands: BrandSummary[];
  categories: CategorySummary[];
  current: Record<string, string | undefined>;
}) {
  const t = useTranslations("Filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      // Reset to first page whenever filters change.
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    // Keep the search query (q) if present; drop everything else.
    const q = params.get("q");
    const kept = new URLSearchParams();
    if (q) kept.set("q", q);
    router.push(`${pathname}?${kept.toString()}`);
  };

  const hasActiveFilters =
    !!current.brand ||
    !!current.category ||
    !!current.minPrice ||
    !!current.maxPrice ||
    !!current.color ||
    !!current.size ||
    !!current.availability;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cool-grey">
          {t("title")}
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-maaroud-blue hover:underline"
          >
            {t("clear")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {brands.length > 0 && (
          <Select
            label={t("brand")}
            value={current.brand ?? ""}
            onChange={(e) => update("brand", e.target.value)}
            options={[
              { value: "", label: "—" },
              ...brands.map((b) => ({ value: b.slug, label: b.name })),
            ]}
          />
        )}
        {categories.length > 0 && (
          <Select
            label={t("category")}
            value={current.category ?? ""}
            onChange={(e) => update("category", e.target.value)}
            options={[
              { value: "", label: "—" },
              ...categories.map((c) => ({ value: c.name, label: c.name })),
            ]}
          />
        )}
        <NumberField
          label={t("minPrice")}
          value={current.minPrice ?? ""}
          onChange={(e) => update("minPrice", e.target.value)}
          placeholder="0"
        />
        <NumberField
          label={t("maxPrice")}
          value={current.maxPrice ?? ""}
          onChange={(e) => update("maxPrice", e.target.value)}
          placeholder="∞"
        />
        <Select
          label={t("availability")}
          value={current.availability ?? ""}
          onChange={(e) => update("availability", e.target.value)}
          options={[
            { value: "", label: "—" },
            { value: "in_stock", label: t("in_stock") },
            { value: "out_of_stock", label: t("out_of_stock") },
            { value: "unknown", label: t("unknown") },
          ]}
        />
        <TextField
          label={t("color")}
          value={current.color ?? ""}
          onChange={(e) => update("color", e.target.value)}
        />
        <TextField
          label={t("size")}
          value={current.size ?? ""}
          onChange={(e) => update("size", e.target.value)}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-cool-grey">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={onChange}
        className="rounded-default border border-stone-grey bg-white px-2 py-1.5 text-sm text-ink-black outline-none focus:border-maaroud-blue"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-default border border-stone-grey bg-white px-2 py-1.5 text-sm text-ink-black outline-none focus:border-maaroud-blue"
      />
    </Field>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-default border border-stone-grey bg-white px-2 py-1.5 text-sm text-ink-black outline-none focus:border-maaroud-blue"
      />
    </Field>
  );
}
