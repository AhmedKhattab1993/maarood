import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { searchProducts, getBrands, getCategories } from "@/lib/api/client";
import { ProductListing } from "@/components/product-listing";
import { ErrorState } from "@/components/state-views";
import { SearchBar } from "@/components/search-bar";
import { toNumber, toSort } from "@/lib/query";

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

  // Brands + categories power the filter bar; non-critical.
  const [brands, categories] = await Promise.allSettled([getBrands(), getCategories()]);
  const brandList = brands.status === "fulfilled" ? brands.value : [];
  const categoryList = categories.status === "fulfilled" ? categories.value : [];

  let body: React.ReactNode;
  if (!q) {
    // No query yet — show the search prompt, no listing.
    body = (
      <div className="mx-auto max-w-xl py-10">
        <SearchBar autoFocus />
      </div>
    );
  } else {
    try {
      const result = await searchProducts(q, {
        brand: current.brand,
        category: current.category,
        minPrice: toNumber(current.minPrice),
        maxPrice: toNumber(current.maxPrice),
        availability: current.availability as never,
        color: current.color,
        size: current.size,
        sort: toSort(current.sort),
        page: toNumber(sp.page) ?? 1,
        limit: 24,
      });
      body = (
        <ProductListing
          result={result}
          brands={brandList}
          categories={categoryList}
          current={current}
          sort={toSort(current.sort)}
          title={t("resultsFor", { query: q })}
          emptyTitle={t("noResults")}
          emptyHint={t("noResultsHint")}
        />
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
