import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { searchProducts, getBrands, getCategories, getFacets } from '@/lib/api/client';
import { ProductListing } from '@/components/product-listing';
import { BrandAvatar } from '@/components/brand-avatar';
import { ErrorState } from '@/components/state-views';
import { Link } from '@/i18n/navigation';
import { toAvailability, toNumber, toSort } from '@/lib/query';
import { priceDraftError } from '@/lib/catalog-filters';
import { categoryItems } from '@/lib/categories';
import type { SearchResult } from '@/lib/api/types';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return {
    title: q ? t('searchTitle', { query: q }) : t('homeTitle'),
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Search' });
  const tFilters = await getTranslations({ locale, namespace: 'Filters' });
  const tCategory = await getTranslations({ locale, namespace: 'Category' });
  const tBrand = await getTranslations({ locale, namespace: 'Brand' });

  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const current = {
    q,
    brand: str(sp.brand),
    category: str(sp.category),
    minPrice: str(sp.minPrice),
    maxPrice: str(sp.maxPrice),
    availability: str(sp.availability),
    color: str(sp.color),
    size: str(sp.size),
    sort: str(sp.sort),
  };

  const minPrice = toNumber(current.minPrice);
  const maxPrice = toNumber(current.maxPrice);
  const invalid = priceDraftError(current.minPrice, current.maxPrice);
  const query = {
    brand: current.brand || undefined,
    category: current.category || undefined,
    minPrice,
    maxPrice,
    availability: toAvailability(current.availability),
    color: current.color || undefined,
    size: current.size || undefined,
    sort: toSort(current.sort) ?? 'relevance',
    limit: 24,
  };

  const facetQuery = { ...query, ...(invalid ? { minPrice: undefined, maxPrice: undefined } : {}) };
  const [brands, categories, facets] = await Promise.allSettled([
    getBrands(current.category || undefined),
    getCategories(facetQuery),
    getFacets(facetQuery),
  ]);
  const brandList = brands.status === 'fulfilled' ? brands.value : [];
  const categoryList = categories.status === 'fulfilled' ? categories.value : [];
  const facetList = facets.status === 'fulfilled' ? facets.value : { colors: [], sizes: [] };

  const categoryLinks = (
    <section
      aria-labelledby="search-categories"
      className="rounded-2xl border border-stone-grey bg-white p-5 md:p-6"
    >
      <h2 id="search-categories" className="mb-4 text-lg font-semibold text-ink-black">
        {t('exploreCategories')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {categoryItems(
          categoryList.filter((category) => category.productCount > 0),
          tCategory,
        ).map((category) => (
          <Link
            key={category.value}
            href={{ pathname: '/c/[category]', params: { category: category.value } }}
            className="inline-flex items-center gap-3 rounded-full border border-stone-grey bg-warm-ivory px-4 py-2.5 text-sm font-medium text-ink-black transition hover:border-maaroud-blue hover:text-maaroud-blue"
          >
            {category.label}
            <span aria-hidden className="text-nike-grey rtl:rotate-180">
              ↗
            </span>
          </Link>
        ))}
        <Link
          href={{ pathname: '/brands' }}
          className="inline-flex items-center gap-3 rounded-full border border-maaroud-blue/20 bg-maaroud-blue/5 px-4 py-2.5 text-sm font-medium text-maaroud-blue transition hover:bg-maaroud-blue/10"
        >
          {t('brands')}{' '}
          <span aria-hidden className="rtl:rotate-180">
            ↗
          </span>
        </Link>
      </div>
    </section>
  );

  let body: React.ReactNode;
  if (!q) {
    body = (
      <div className="mx-auto max-w-3xl space-y-8 py-6 md:py-12">
        <div className="rounded-3xl bg-warm-ivory px-6 py-10 text-center md:px-10">
          <span
            aria-hidden
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-maaroud-blue"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-black md:text-4xl">
            {t('browseTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-nike-grey">
            {t('browseHint')}
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-nike-grey">{t('startHint')}</p>
        </div>
        {categoryLinks}
      </div>
    );
  } else if (invalid) {
    body = (
      <ProductListing
        result={{ items: [], page: 1, limit: 24, total: 0 }}
        brands={brandList}
        categories={categoryList}
        current={current}
        sort={toSort(current.sort) ?? 'relevance'}
        title={t('products')}
        emptyTitle={tFilters(invalid)}
        facets={facetList}
        feed={{ kind: 'search', q, query }}
      />
    );
  } else {
    try {
      const result: SearchResult = await searchProducts(q, { ...query, page: 1 });
      const matchedBrands = result.brands ?? [];
      body = (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="break-words text-2xl font-semibold tracking-tight text-ink-black md:text-3xl">
              {t('resultsFor', { query: q })}
            </h1>
            <Link
              href={{ pathname: '/search' }}
              className="rounded-full border border-stone-grey bg-white px-4 py-2 text-sm font-medium text-nike-grey transition hover:border-maaroud-blue hover:text-maaroud-blue"
            >
              {t('clear')}
            </Link>
          </div>
          {matchedBrands.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium text-ink-black">{t('brands')}</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matchedBrands.slice(0, 6).map((b) => (
                  <li key={b.id}>
                    <Link
                      href={{
                        pathname: '/brands/[slug]',
                        params: { slug: b.slug },
                      }}
                      className="flex h-full items-center gap-4 rounded-2xl border border-stone-grey bg-white p-4 text-ink-black transition hover:border-maaroud-blue hover:shadow-sm"
                    >
                      <BrandAvatar name={b.name} logoUrl={b.logoUrl} size={48} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{b.name}</span>
                        <span className="mt-1 block text-xs text-nike-grey">
                          {tBrand('productsCount', { count: b.productCount })}
                        </span>
                      </span>
                      <span aria-hidden className="text-nike-grey rtl:rotate-180">
                        ↗
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ProductListing
            result={result}
            brands={brandList}
            categories={categoryList}
            current={current}
            sort={toSort(current.sort) ?? 'relevance'}
            title={t('products')}
            heading="h2"
            emptyTitle={t('noResults')}
            emptyHint={t('noResultsHint')}
            facets={facetList}
            feed={{ kind: 'search', q, query }}
          />
          {result.total === 0 && (
            <div className="space-y-5">
              {Object.entries(current).some(
                ([key, value]) => key !== 'q' && key !== 'sort' && value,
              ) && (
                <Link
                  href={{ pathname: '/search', query: { q } }}
                  className="inline-flex rounded-full bg-maaroud-blue px-5 py-3 text-sm font-medium text-white transition hover:bg-maaroud-blue-dark"
                >
                  {t('tryWithoutFilters')}
                </Link>
              )}
              {categoryLinks}
            </div>
          )}
        </div>
      );
    } catch (err) {
      body = <ErrorState error={err} />;
    }
  }

  return <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">{body}</div>;
}

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}
