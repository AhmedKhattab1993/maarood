'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useCallback, useId, useState } from 'react';
import type {
  BrandSummary,
  CategorySummary,
  PaginatedResult,
  PublicProduct,
  ProductSort,
} from '@/lib/api/types';
import type { DiscoverySource } from '@/lib/api/public-client';
import { categoryName } from '@/lib/categories';
import { clearFilterParams, priceDraftError } from '@/lib/catalog-filters';
import { useQueryParams } from '@/lib/use-query-params';
import { FilterBar } from './filter-bar';
import { FilterChips } from './filter-chips';
import { SortSelect } from './sort-select';
import { DiscoveryFeed } from './discovery-feed';
import { ProductGridSkeleton } from './product-grid';
import { EmptyState } from './state-views';
import { CategoryStrip } from './category-strip';
import type { ProductLayout } from './product-feed-layout';
import type { CatalogFacets } from '@/lib/api/types';

/** Shared catalog with a persistent desktop filter rail and a mobile drawer. */
export function ProductListing({
  result,
  brands,
  categories,
  current,
  sort,
  title,
  heading = 'h1',
  hideAuthor = false,
  isLoading = false,
  emptyTitle,
  emptyHint,
  feed,
  layout = 'grid',
  categoryNav = 'query',
  facets,
  personalized = false,
  hideBrandFilter = false,
}: {
  result: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  categories?: CategorySummary[];
  current: Record<string, string | undefined>;
  sort?: ProductSort;
  /** Catalog title, e.g. the category or brand name. */
  title: string;
  /** "h2" when another element is already the page's h1 (brand page). */
  heading?: 'h1' | 'h2';
  /** Hide the author row on cards (brand page already owns the brand identity). */
  hideAuthor?: boolean;
  isLoading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
  feed: DiscoverySource;
  /** Following is not this component. Catalog pages stay on the grid. */
  layout?: ProductLayout;
  /** `path` is the /c/[category] page; other catalogs refine with query params. */
  categoryNav?: 'query' | 'path';
  facets?: CatalogFacets;
  /** Keeps For you available in sorting; explicit sorting disables ranking. */
  personalized?: boolean;
  /** Brand detail pages already fix the brand in their route. */
  hideBrandFilter?: boolean;
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
        personalized={personalized}
        hideBrandFilter={hideBrandFilter}
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
  heading = 'h1',
  hideAuthor = false,
  isLoading = false,
  emptyTitle,
  emptyHint,
  feed,
  layout = 'grid',
  categoryNav = 'query',
  facets,
  personalized = false,
  hideBrandFilter = false,
}: {
  result: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  categories?: CategorySummary[];
  current: Record<string, string | undefined>;
  sort?: ProductSort;
  title: string;
  heading?: 'h1' | 'h2';
  hideAuthor?: boolean;
  isLoading?: boolean;
  emptyTitle: string;
  emptyHint?: string;
  feed: DiscoverySource;
  layout?: ProductLayout;
  categoryNav?: 'query' | 'path';
  facets?: CatalogFacets;
  personalized?: boolean;
  hideBrandFilter?: boolean;
}) {
  const Heading = heading;
  const t = useTranslations('Filters');
  const tCat = useTranslations('Category');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dialogId = useId();
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
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
    pushParams(clearFilterParams(searchParams), true);
  }, [pushParams, searchParams]);

  const chips = [
    searchParams.get('brand') && !hideBrandFilter
      ? {
          key: 'brand',
          label: `${t('brand')}: ${brands?.find((b) => b.slug === current.brand)?.name ?? current.brand ?? ''}`,
        }
      : null,
    searchParams.get('category')
      ? { key: 'category', label: categoryName(current.category ?? '', tCat) }
      : null,
    searchParams.get('minPrice')
      ? { key: 'minPrice', label: `${t('minPrice')}: ${current.minPrice}` }
      : null,
    searchParams.get('maxPrice')
      ? { key: 'maxPrice', label: `${t('maxPrice')}: ${current.maxPrice}` }
      : null,
    searchParams.get('availability') &&
    (current.availability === 'in_stock' ||
      current.availability === 'out_of_stock' ||
      current.availability === 'unknown')
      ? { key: 'availability', label: t(current.availability) }
      : null,
    searchParams.get('color')
      ? { key: 'color', label: `${t('color')}: ${current.color ?? ''}` }
      : null,
    searchParams.get('size') ? { key: 'size', label: `${t('size')}: ${current.size ?? ''}` } : null,
  ].filter((c): c is { key: string; label: string } => c !== null);

  const activeCount = chips.length;
  const priceError = priceDraftError(current.minPrice ?? '', current.maxPrice ?? '');

  if (isLoading) {
    return <ProductGridSkeleton layout={layout} />;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {(categories?.length ?? 0) > 0 && (
        <div className="min-w-0 md:hidden">
          <CategoryStrip
            categories={categories ?? []}
            active={current.category}
            mode={categoryNav}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-grey pb-4 md:pb-5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 md:block">
          <Heading className="text-2xl font-semibold tracking-tight text-ink-black md:text-3xl">
            {title}
          </Heading>
          <p className="text-sm text-nike-grey md:mt-1" aria-live="polite">
            {t('resultsCount', { count: priceError ? 0 : result.total })}
          </p>
        </div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-expanded={filtersOpen}
            aria-controls={dialogId}
            aria-haspopup="dialog"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-grey bg-white px-3 py-2 text-sm font-medium text-ink-black md:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 17h16M8 4v6M16 14v6" />
            </svg>
            <span>{t('showFilters')}</span>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-maaroud-blue/10 px-1 text-xs text-maaroud-blue">
                {activeCount}
              </span>
            )}
          </button>
          <SortSelect current={sort} personalized={personalized} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:gap-6 lg:gap-8">
        <FilterBar
          brands={hideBrandFilter ? [] : (brands ?? [])}
          categories={categories}
          categoryNav={categoryNav}
          facets={facets}
          current={hideBrandFilter ? { ...current, brand: undefined } : current}
          open={filtersOpen}
          onClose={closeFilters}
          dialogId={dialogId}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {chips.length > 0 && (
            <FilterChips items={chips} onRemove={(key) => update(key, '')} onClearAll={clearAll} />
          )}
          {priceError ? (
            <div
              role="alert"
              className="rounded-2xl border border-alert-red/20 bg-alert-red/5 p-5 text-sm"
            >
              <p className="text-alert-red">{t(priceError)}</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-3 font-medium text-maaroud-blue underline"
              >
                {t('clearAll')}
              </button>
            </div>
          ) : result.items.length === 0 ? (
            <EmptyState
              title={activeCount > 0 ? t('noMatches') : emptyTitle}
              hint={activeCount > 0 ? t('adjust') : emptyHint}
              action={
                activeCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mt-2 min-h-11 rounded-xl bg-maaroud-blue px-5 py-2 text-sm font-semibold text-white hover:bg-maaroud-blue-dark"
                  >
                    {t('clearAll')}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <DiscoveryFeed
              initial={result}
              brands={brands}
              source={feed}
              hideAuthor={hideAuthor}
              layout={layout}
              personalized={personalized && !sort}
            />
          )}
        </div>
      </div>
    </div>
  );
}
