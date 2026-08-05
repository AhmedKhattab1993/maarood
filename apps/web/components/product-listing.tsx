import { useTranslations } from "next-intl";
import type { BrandSummary, CategorySummary, PaginatedResult, PublicProduct } from "@/lib/api/types";
import { FilterBar } from "./filter-bar";
import { SortSelect } from "./sort-select";
import { ProductGrid, ProductGridSkeleton } from "./product-grid";
import { Pagination } from "./pagination";
import { EmptyState } from "./state-views";
import type { ProductSort } from "@/lib/api/types";

/**
 * Shared listing body used by Search, Category, and Brand pages. Handles the
 * four required states (loading skeleton, empty, populated, with stale flags
 * inside cards). Error handling is done by the caller.
 */
export function ProductListing({
  result,
  brands,
  categories,
  current,
  sort,
  isLoading = false,
  emptyTitle,
  emptyHint,
}: {
  result: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  categories?: CategorySummary[];
  current: Record<string, string | undefined>;
  sort?: ProductSort;
  isLoading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
}) {
  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (result.items.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
      <FilterBar
        brands={brands ?? []}
        categories={categories ?? []}
        current={current}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex items-center justify-between">
          <CountBar total={result.total} />
          <SortSelect current={sort} />
        </div>
        <ProductGrid products={result.items} brands={brands} />
        <Pagination page={result.page} limit={result.limit} total={result.total} />
      </div>
    </div>
  );
}

function CountBar({ total }: { total: number }) {
  const t = useTranslations("Brand");
  return (
    <span className="text-sm text-cool-grey">{t("productsCount", { count: total })}</span>
  );
}
