import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { searchProducts, getBrands, getCategories, getFacets } from "@/lib/api/client";
import { ProductListing } from "@/components/product-listing";
import { ErrorState } from "@/components/state-views";
import { Link } from "@/i18n/navigation";
import { invalidPriceRange, toNumber, toSort } from "@/lib/query";
import type { SearchResult } from "@/lib/api/types";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: q ? t("searchTitle", { query: q }) : t("homeTitle"),
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
  const t = await getTranslations({ locale, namespace: "Search" });
  const tFilters = await getTranslations({ locale, namespace: "Filters" });

  const q = typeof sp.q === "string" ? sp.q : "";
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

  const [brands, categories, facets] = await Promise.allSettled([
    getBrands(),
    getCategories(),
    getFacets({
      brand: current.brand || undefined,
      category: current.category || undefined,
    }),
  ]);
  const brandList = brands.status === "fulfilled" ? brands.value : [];
  const categoryList = categories.status === "fulfilled" ? categories.value : [];
  const facetList =
    facets.status === "fulfilled" ? facets.value : { colors: [], sizes: [] };

  const minPrice = toNumber(current.minPrice);
  const maxPrice = toNumber(current.maxPrice);
  const invalid = invalidPriceRange(minPrice, maxPrice);
  const query = {
    brand: current.brand || undefined,
    category: current.category || undefined,
    minPrice,
    maxPrice,
    availability: current.availability as never,
    color: current.color || undefined,
    size: current.size || undefined,
    sort: toSort(current.sort),
    limit: 24,
  };

  let body: React.ReactNode;
  if (!q) {
    body = (
      <p className="mx-auto max-w-xl py-10 text-sm text-nike-grey">{t("startHint")}</p>
    );
  } else if (invalid) {
    body = (
      <ProductListing
        result={{ items: [], page: 1, limit: 24, total: 0 }}
        brands={brandList}
        categories={categoryList}
        current={current}
        sort={toSort(current.sort)}
        title={t("products")}
        emptyTitle={tFilters("invalidRange")}
        facets={facetList}
        feed={{ kind: "search", q, query }}
      />
    );
  } else {
    try {
      const result: SearchResult = await searchProducts(q, { ...query, page: 1 });
      const matchedBrands = result.brands ?? [];
      body = (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-sm text-nike-grey">{t("resultsFor", { query: q })}</p>
            <Link
              href={{ pathname: "/" }}
              className="text-sm text-maaroud-blue hover:underline"
            >
              {t("clear")}
            </Link>
          </div>
          {matchedBrands.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium text-ink-black">
                {t("brands")}
              </h2>
              <ul className="flex flex-col gap-2">
                {matchedBrands.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={{
                        pathname: "/brands/[slug]",
                        params: { slug: b.slug },
                      }}
                      className="text-sm font-medium text-ink-black hover:underline"
                    >
                      {b.name}
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
            sort={toSort(current.sort)}
            title={t("products")}
            emptyTitle={t("noResults")}
            emptyHint={t("noResultsHint")}
            facets={facetList}
            feed={{ kind: "search", q, query }}
          />
        </div>
      );
    } catch (err) {
      body = <ErrorState error={err} />;
    }
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      {body}
    </div>
  );
}

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}
