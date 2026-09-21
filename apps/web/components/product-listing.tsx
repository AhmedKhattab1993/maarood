"use client";

import { useTranslations } from "next-intl";
import { Suspense, useCallback, useRef, useState } from "react";
import type {
  BrandSummary,
  CategorySummary,
  PaginatedResult,
  PublicProduct,
  ProductSort,
} from "@/lib/api/types";
import type { DiscoverySource } from "@/lib/api/public-client";
import { categoryName } from "@/lib/categories";
import { invalidPriceRange, toNumber } from "@/lib/query";
import { useQueryParams } from "@/lib/use-query-params";
import { FilterBar } from "./filter-bar";
import { FilterChips } from "./filter-chips";
import { SortSelect } from "./sort-select";
import { DiscoveryFeed } from "./discovery-feed";
import { ProductGridSkeleton } from "./product-grid";
import { EmptyState } from "./state-views";
import { CategoryStrip } from "./category-strip";
import type { ProductLayout } from "./product-feed-layout";
import type { CatalogFacets } from "@/lib/api/types";

/**
 * Shared listing body used by Search, Category, and Brand pages — Nike-style.
 * A single wall-header row: `Title (count)` on the left, `Show/Hide Filters` +
 * `Sort` on the right. Below: the toggleable filter rail + product feed.
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
  heading = "h1",
  hideAuthor = false,
  isLoading = false,
  emptyTitle,
  emptyHint,
  feed,
  layout = "grid",
  categoryNav = "query",
  facets,
}: {
  result: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  categories?: CategorySummary[];
  current: Record<string, string | undefined>;
  sort?: ProductSort;
  /** Wall title, e.g. the category or brand name (count is appended inline). */
  title: string;
  /** "h2" when another element is already the page's h1 (brand page). */
  heading?: "h1" | "h2";
  /** Hide the author row on cards (brand page already owns the brand identity). */
  hideAuthor?: boolean;
  isLoading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
  feed: DiscoverySource;
  /** Following is not this component. Catalog pages stay on the grid. */
  layout?: ProductLayout;
  /** `path` is the /c/[category] page. Brand pages pass no categories. */
  categoryNav?: "query" | "path";
  facets?: CatalogFacets;
}) {
  return (
    <Suspense fallback={<ProductGridSkeleton layout={layout} />}>
      <ProductListingInner
        result={result}
        brands={brands}
        categories={categories}
        current={current}
        sort={sort}
        title={title}
        heading={heading}
        isLoading={isLoading}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
        feed={feed}
        hideAuthor={hideAuthor}
        layout={layout}
        categoryNav={categoryNav}
        facets={facets}
      />
    </Suspense>
  );
}

function ProductListingInner({
  result,
  brands,
  categories,
  current,
  sort,
  title,
  heading = "h1",
  hideAuthor = false,
  isLoading = false,
  emptyTitle,
  emptyHint,
  feed,
  layout = "grid",
  categoryNav = "query",
  facets,
}: {
  result: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  categories?: CategorySummary[];
  current: Record<string, string | undefined>;
  sort?: ProductSort;
  title: string;
  heading?: "h1" | "h2";
  hideAuthor?: boolean;
  isLoading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
  feed: DiscoverySource;
  layout?: ProductLayout;
  categoryNav?: "query" | "path";
  facets?: CatalogFacets;
}) {
  const Heading = heading;
  const t = useTranslations("Filters");
  const tCat = useTranslations("Category");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const commitPrice = useRef<() => void>(() => {});
  const registerCommit = useCallback((commit: () => void) => {
    commitPrice.current = commit;
  }, []);
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

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const q = params.get("q");
    const kept = new URLSearchParams();
    if (q) kept.set("q", q);
    pushParams(kept);
  }, [pushParams, searchParams]);

  const chips = [
    searchParams.get("brand")
      ? {
          key: "brand",
          label:
            brands?.find((b) => b.slug === current.brand)?.name ?? current.brand ?? "",
        }
      : null,
    searchParams.get("category")
      ? { key: "category", label: categoryName(current.category ?? "", tCat) }
      : null,
    searchParams.get("minPrice")
      ? { key: "minPrice", label: `${current.minPrice}+` }
      : null,
    searchParams.get("maxPrice")
      ? { key: "maxPrice", label: `≤ ${current.maxPrice}` }
      : null,
    searchParams.get("availability") &&
    (current.availability === "in_stock" ||
      current.availability === "out_of_stock" ||
      current.availability === "unknown")
      ? { key: "availability", label: t(current.availability) }
      : null,
    searchParams.get("color") ? { key: "color", label: current.color ?? "" } : null,
    searchParams.get("size") ? { key: "size", label: current.size ?? "" } : null,
  ].filter((c): c is { key: string; label: string } => c !== null);

  const activeCount = chips.length;
  const invalid = invalidPriceRange(
    toNumber(current.minPrice),
    toNumber(current.maxPrice),
  );

  if (isLoading) {
    return <ProductGridSkeleton layout={layout} />;
  }

  return (
    <div className="flex flex-col">
      {(categories?.length ?? 0) > 0 && (
        <CategoryStrip
          categories={categories ?? []}
          active={current.category}
          mode={categoryNav}
        />
      )}
      <div className="flex items-baseline justify-between gap-4 border-b border-stone-grey pb-4">
        <Heading className="text-2xl font-semibold text-ink-black md:text-3xl">
          {title}{" "}
          <span className="text-nike-grey">({invalid ? 0 : result.total})</span>
        </Heading>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => {
              if (filtersOpen) commitPrice.current();
              setFiltersOpen((open) => !open);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-black"
          >
            <span>{filtersOpen ? t("hideFilters") : t("showFilters")}</span>
            {activeCount > 0 && (
              <span className="text-xs text-nike-grey">{activeCount}</span>
            )}
          </button>
          <SortSelect current={sort} />
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-6 md:flex-row md:items-start md:gap-8">
        <FilterBar
          brands={brands ?? []}
          facets={facets}
          current={current}
          open={filtersOpen}
          onToggle={() => setFiltersOpen((open) => !open)}
          onRegisterCommit={registerCommit}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Chips restate what the rail shows, so hide them on desktop while it is open. */}
          {chips.length > 0 && (
            <div className={filtersOpen ? "md:hidden" : undefined}>
              <FilterChips
                items={chips}
                onRemove={(key) => update(key, "")}
                onClearAll={clearAll}
              />
            </div>
          )}
          {invalid ? (
            <p role="alert" className="text-sm text-alert-red">
              {t("invalidRange")}
            </p>
          ) : result.items.length === 0 ? (
            <EmptyState
              title={activeCount > 0 ? t("noMatches") : emptyTitle}
              hint={activeCount > 0 ? t("adjust") : emptyHint}
            />
          ) : (
            <DiscoveryFeed
              initial={result}
              brands={brands}
              source={feed}
              hideAuthor={hideAuthor}
              layout={layout}
            />
          )}
        </div>
      </div>
    </div>
  );
}
