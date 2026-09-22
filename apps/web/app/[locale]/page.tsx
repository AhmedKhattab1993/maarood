import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProducts, getBrands, getCategories, getFacets } from '@/lib/api/client';
import { ProductListing } from '@/components/product-listing';
import { ErrorState } from '@/components/state-views';
import { Link } from '@/i18n/navigation';
import { toAvailability, toNumber, toSort } from '@/lib/query';
import { priceDraftError } from '@/lib/catalog-filters';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
  };
}

/** Discovery defaults to a private, fresh feed; explicit sorts remain catalog views. */
export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: 'Nav' });
  const tHome = await getTranslations({ locale, namespace: 'Home' });
  const tFeed = await getTranslations({ locale, namespace: 'Feed' });
  const tFilters = await getTranslations({ locale, namespace: 'Filters' });
  const sp = await searchParams;
  const current = {
    brand: str(sp.brand),
    category: str(sp.category),
    minPrice: str(sp.minPrice),
    maxPrice: str(sp.maxPrice),
    availability: str(sp.availability),
    color: str(sp.color),
    size: str(sp.size),
  };

  const query = {
    brand: current.brand || undefined,
    category: current.category || undefined,
    minPrice: toNumber(current.minPrice),
    maxPrice: toNumber(current.maxPrice),
    availability: toAvailability(current.availability),
    color: current.color || undefined,
    size: current.size || undefined,
    sort: toSort(sp.sort),
    limit: 24,
  };
  const invalid = priceDraftError(current.minPrice, current.maxPrice);

  const facetQuery = { ...query, ...(invalid ? { minPrice: undefined, maxPrice: undefined } : {}) };
  const [brands, categories, facets] = await Promise.allSettled([
    getBrands(current.category || undefined),
    getCategories(facetQuery),
    getFacets(facetQuery),
  ]);
  const brandList = brands.status === 'fulfilled' ? brands.value : [];
  const categoryList = categories.status === 'fulfilled' ? categories.value : [];
  const facetList = facets.status === 'fulfilled' ? facets.value : { colors: [], sizes: [] };

  let body: React.ReactNode;
  try {
    const result = invalid
      ? { items: [], page: 1, limit: 24, total: 0 }
      : await getProducts({ ...query, page: 1 });
    body = (
      <ProductListing
        result={result}
        brands={brandList}
        categories={categoryList}
        current={current}
        sort={query.sort}
        personalized
        title={query.sort ? tNav('explore') : tFeed('title')}
        emptyTitle={tFilters('noMatches')}
        emptyHint={tFilters('adjust')}
        facets={facetList}
        feed={{ kind: 'products', query }}
      />
    );
  } catch (err) {
    body = <ErrorState error={err} />;
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-4 md:px-6 md:py-8">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-stone-grey pb-4 md:mb-7 md:flex-wrap md:pb-6">
        <div>
          <p className="text-xs font-semibold tracking-wide text-maaroud-blue md:mb-1">
            {tHome('discoveryEyebrow')}
          </p>
          <p className="hidden text-base leading-relaxed text-nike-grey md:block">
            {tHome('discoveryHint')}
          </p>
        </div>
        <Link
          href="/brands"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill border border-stone-grey bg-white px-4 py-2 text-sm font-medium hover:border-maaroud-blue hover:text-maaroud-blue"
        >
          {tNav('brands')} <span aria-hidden="true">↗</span>
        </Link>
      </div>
      {body}
    </div>
  );
}

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}
