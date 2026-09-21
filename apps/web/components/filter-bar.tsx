"use client";

import { useTranslations } from "next-intl";
import { useQueryParams } from "@/lib/use-query-params";
import { facetChoices, shopperFacets } from "@/lib/facet-choices";
import { nextPriceParams } from "@/lib/price-draft";
import type { CatalogFacets } from "@/lib/api/types";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { BrandSummary } from "@/lib/api/types";

const EMPTY_FACETS: CatalogFacets = { colors: [], sizes: [] };

/**
 * Filter drawer and desktop rail. Category is the scrolling row above the
 * listing. Price commits on blur or when the drawer closes. Color and size
 * are catalog choices, not free-text fields.
 */
export function FilterBar({
  brands,
  facets = EMPTY_FACETS,
  current,
  open,
  onToggle,
  onRegisterCommit,
}: {
  brands: BrandSummary[];
  facets?: CatalogFacets;
  current: Record<string, string | undefined>;
  open: boolean;
  onToggle: () => void;
  /** Lets the header "Hide" control commit a price draft before closing. */
  onRegisterCommit?: (commit: () => void) => void;
}) {
  return (
    <Suspense fallback={null}>
      <FilterBarInner
        brands={brands}
        facets={facets}
        current={current}
        open={open}
        onToggle={onToggle}
        onRegisterCommit={onRegisterCommit}
      />
    </Suspense>
  );
}

function FilterBarInner({
  brands,
  facets,
  current,
  open,
  onToggle,
  onRegisterCommit,
}: {
  brands: BrandSummary[];
  facets: CatalogFacets;
  current: Record<string, string | undefined>;
  open: boolean;
  onToggle: () => void;
  onRegisterCommit?: (commit: () => void) => void;
}) {
  const t = useTranslations("Filters");
  const { searchParams, pushParams } = useQueryParams();
  const [minDraft, setMinDraft] = useState(current.minPrice ?? "");
  const [maxDraft, setMaxDraft] = useState(current.maxPrice ?? "");

  useEffect(() => {
    setMinDraft(current.minPrice ?? "");
    setMaxDraft(current.maxPrice ?? "");
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

  const commitPrice = useCallback(() => {
    const next = nextPriceParams(searchParams, minDraft, maxDraft);
    if (next) pushParams(next, true);
  }, [maxDraft, minDraft, pushParams, searchParams]);

  useEffect(() => {
    onRegisterCommit?.(commitPrice);
  }, [commitPrice, onRegisterCommit]);

  const close = () => {
    commitPrice();
    onToggle();
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    const q = params.get("q");
    const kept = new URLSearchParams();
    if (q) kept.set("q", q);
    pushParams(kept);
  };

  const activeCount =
    (current.brand ? 1 : 0) +
    (current.minPrice ? 1 : 0) +
    (current.maxPrice ? 1 : 0) +
    (current.color ? 1 : 0) +
    (current.size ? 1 : 0) +
    (current.availability ? 1 : 0);

  if (!open) return null;

  const facetList = (
    <FacetList
      brands={brands}
      facets={facets}
      current={current}
      update={update}
      minDraft={minDraft}
      maxDraft={maxDraft}
      onMinDraft={setMinDraft}
      onMaxDraft={setMaxDraft}
      onPriceBlur={commitPrice}
    />
  );

  return (
    <>
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-20 flex flex-col gap-4">
          <FilterHeader onClear={clearAll} showClear={activeCount > 0} />
          {facetList}
        </div>
      </aside>

      <div className="fixed inset-0 z-50 md:hidden">
        <button
          type="button"
          aria-label={t("hideFilters")}
          onClick={close}
          className="absolute inset-0 bg-ink-black/40"
        />
        <div className="absolute inset-y-0 start-0 flex w-[85%] max-w-sm flex-col gap-5 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <FilterHeader onClear={clearAll} showClear={activeCount > 0} />
            <button
              type="button"
              aria-label={t("hideFilters")}
              onClick={close}
              className="text-nike-grey hover:text-ink-black"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FacetList
              brands={brands}
              facets={facets}
              current={current}
              update={update}
              minDraft={minDraft}
              maxDraft={maxDraft}
              onMinDraft={setMinDraft}
              onMaxDraft={setMaxDraft}
              onPriceBlur={commitPrice}
            />
          </div>
          <button
            type="button"
            onClick={close}
            className="border border-ink-black bg-ink-black px-4 py-2.5 text-sm font-medium text-white"
          >
            {t("apply")}
          </button>
        </div>
      </div>
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
  facets,
  current,
  update,
  minDraft,
  maxDraft,
  onMinDraft,
  onMaxDraft,
  onPriceBlur,
}: {
  brands: BrandSummary[];
  facets: CatalogFacets;
  current: Record<string, string | undefined>;
  update: (key: string, value: string) => void;
  minDraft: string;
  maxDraft: string;
  onMinDraft: (value: string) => void;
  onMaxDraft: (value: string) => void;
  onPriceBlur: () => void;
}) {
  const t = useTranslations("Filters");
  const shown = shopperFacets(facets);
  const colors = facetChoices(shown.colors, current.color);
  const sizes = facetChoices(shown.sizes, current.size);
  return (
    <div className="flex flex-col divide-y divide-stone-grey">
      {brands.length > 0 && (
        <Facet label={t("brand")}>
          <Select
            value={current.brand ?? ""}
            onChange={(event) => update("brand", event.target.value)}
            options={[
              { value: "", label: t("all") },
              ...brands.map((brand) => ({ value: brand.slug, label: brand.name })),
            ]}
          />
        </Facet>
      )}
      <Facet label={t("price")}>
        <div className="flex items-center gap-2">
          <NumberField
            value={minDraft}
            onChange={onMinDraft}
            onBlur={onPriceBlur}
            placeholder={t("minPrice")}
            label={t("minPrice")}
          />
          <span className="text-nike-grey">–</span>
          <NumberField
            value={maxDraft}
            onChange={onMaxDraft}
            onBlur={onPriceBlur}
            placeholder={t("maxPrice")}
            label={t("maxPrice")}
          />
        </div>
      </Facet>
      <Facet label={t("availability")}>
        <Select
          value={current.availability ?? ""}
          onChange={(event) => update("availability", event.target.value)}
          options={[
            { value: "", label: t("all") },
            { value: "in_stock", label: t("in_stock") },
            { value: "out_of_stock", label: t("out_of_stock") },
            { value: "unknown", label: t("unknown") },
          ]}
        />
      </Facet>
      {colors.length > 0 && (
        <Facet label={t("color")}>
          <ChoiceList
            values={colors}
            selected={current.color}
            onSelect={(value) => update("color", value)}
          />
        </Facet>
      )}
      {sizes.length > 0 && (
        <Facet label={t("size")}>
          <ChoiceList
            values={sizes}
            selected={current.size}
            onSelect={(value) => update("size", value)}
          />
        </Facet>
      )}
    </div>
  );
}

function ChoiceList({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ul className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
      {values.map((value) => {
        const active = selected?.toLocaleLowerCase() === value.toLocaleLowerCase();
        return (
          <li key={value}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? "" : value)}
              className={
                active
                  ? "border border-ink-black bg-ink-black px-2 py-1 text-xs text-white"
                  : "border border-stone-grey px-2 py-1 text-xs text-ink-black hover:border-ink-black"
              }
            >
              {value}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Facet({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-stone-grey py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm font-medium text-ink-black">
        {label}
        <span className="text-nike-grey transition-transform group-open:rotate-180">
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
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-default border border-cool-grey bg-white px-3 py-2 text-sm text-ink-black outline-none focus:border-ink-black"
    >
      {options.map((option) => (
        <option key={option.value || "all"} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function NumberField({
  value,
  onChange,
  onBlur,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  label: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full rounded-default border border-cool-grey bg-white px-3 py-2 text-sm text-ink-black outline-none focus:border-ink-black"
    />
  );
}
