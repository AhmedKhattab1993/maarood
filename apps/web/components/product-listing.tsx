"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
  BrandSummary,
  CategorySummary,
  PaginatedResult,
  PublicProduct,
  ProductSort,
} from "@/lib/api/types";
import { FilterBar } from "./filter-bar";
import { SortSelect } from "./sort-select";
import { ProductGrid, ProductGridSkeleton } from "./product-grid";
import { Pagination } from "./pagination";
import { EmptyState } from "./state-views";

/**
 * Shared listing body used by Search, Category, and Brand pages — Nike-style.
 * A single wall-header row: `Title (count)` on the left, `Show/Hide Filters` +
 * `Sort` on the right. Below: the toggleable filter rail + product grid.
 * Handles loading skeleton and empty states. Error handling is by the caller.
 *
 * The filter toggle lives in the header; FilterBar (the rail + its mutation
 * logic) lives in the body row. Both share the `filtersOpen` state owned here.
 */
export function ProductListing({
  result,
  brands,
  categories,
  current,
  sort,
  title,
  isLoading = false,
  emptyTitle,
  emptyHint,
}: {
  result: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  categories?: CategorySummary[];
  current: Record<string, string | undefined>;
  sort?: ProductSort;
  /** Wall title, e.g. the category or brand name (count is appended inline). */
  title: string;
  isLoading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
}) {
  const t = useTranslations("Filters");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount =
    (current.brand ? 1 : 0) +
    (current.category ? 1 : 0) +
    (current.minPrice ? 1 : 0) +
    (current.maxPrice ? 1 : 0) +
    (current.color ? 1 : 0) +
    (current.size ? 1 : 0) +
    (current.availability ? 1 : 0);

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (result.items.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="flex flex-col">
      {/* Wall header — title+count left, filter toggle + sort right */}
      <div className="flex items-baseline justify-between gap-4 border-b border-stone-grey pb-4">
        <h1 className="text-2xl font-medium text-ink-black md:text-3xl">
          {title} <span className="text-cool-grey">({result.total})</span>
        </h1>
        <div className="flex items-center gap-6">
          {/* Filter toggle — controls the rail below */}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-black"
          >
            <span>{filtersOpen ? t("hideFilters") : t("showFilters")}</span>
            {activeCount > 0 && (
              <span className="text-xs text-cool-grey">{activeCount}</span>
            )}
          </button>
          <SortSelect current={sort} />
        </div>
      </div>

      {/* Body: rail (when open) + grid */}
      <div className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:gap-8">
        <FilterBar
          brands={brands ?? []}
          categories={categories ?? []}
          current={current}
          open={filtersOpen}
          onToggle={() => setFiltersOpen((o) => !o)}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <ProductGrid products={result.items} brands={brands} />
          <Pagination
            page={result.page}
            limit={result.limit}
            total={result.total}
          />
        </div>
      </div>
    </div>
  );
}
