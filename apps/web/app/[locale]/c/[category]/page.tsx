import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProducts, getBrands, getCategories, getFacets } from '@/lib/api/client';
import { ProductListing } from '@/components/product-listing';
import { ErrorState } from '@/components/state-views';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { toAvailability, toNumber, toSort } from '@/lib/query';
import { priceDraftError } from '@/lib/catalog-filters';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { categoryName } from '@/lib/categories';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  const tCat = await getTranslations({ locale, namespace: 'Category' });
  const name = categoryName(decodeCategory(category), tCat);
  return { title: t('categoryTitle', { category: name }) };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations({ locale });
  const tCat = await getTranslations({ locale, namespace: 'Category' });

  const categoryValue = decodeCategory(category);
  const current = {
    category: categoryValue,
    brand: str(sp.brand),
    minPrice: str(sp.minPrice),
    maxPrice: str(sp.maxPrice),
    availability: str(sp.availability),
    color: str(sp.color),
    size: str(sp.size),
  };

  const listingQuery = {
    category: categoryValue,
    brand: current.brand || undefined,
    minPrice: toNumber(current.minPrice),
    maxPrice: toNumber(current.maxPrice),
    availability: toAvailability(current.availability),
    color: current.color || undefined,
    size: current.size || undefined,
    sort: toSort(sp.sort) ?? 'newest',
    limit: 24,
  };
  const invalid = priceDraftError(current.minPrice, current.maxPrice);

  const facetQuery = {
    ...listingQuery,
    ...(invalid ? { minPrice: undefined, maxPrice: undefined } : {}),
  };
  const [brands, categories, facets] = await Promise.allSettled([
    getBrands(categoryValue),
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
      : await getProducts({ ...listingQuery, page: 1 });
    body = (
      <>
        <ProductListing
          result={result}
          brands={brandList}
          categories={categoryList}
          current={current}
          sort={toSort(sp.sort) ?? 'newest'}
          title={categoryName(categoryValue, tCat)}
          emptyTitle={t('Search.noResults')}
          emptyHint={t('Search.noResultsHint')}
          categoryNav="path"
          facets={facetList}
          feed={{
            kind: 'products',
            query: listingQuery,
          }}
        />
      </>
    );
  } catch (err) {
    body = <ErrorState error={err} />;
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: t('Nav.home'), href: { pathname: '/' } },
          { label: categoryName(categoryValue, tCat) },
        ]}
      />
      <div className="mt-4">{body}</div>
    </div>
  );
}

function str(v: string | string[] | undefined): string {
  return typeof v === 'string' ? v : '';
}

/** Category in the URL may be the raw value or kebab-encoded. */
function decodeCategory(category: string): string {
  try {
    return decodeURIComponent(category);
  } catch {
    return category;
  }
}
