import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProducts, getBrands, getCategories } from "@/lib/api/client";
import { ProductListing } from "@/components/product-listing";
import { ErrorState } from "@/components/state-views";
import { invalidPriceRange, toNumber, toSort } from "@/lib/query";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  };
}

/** Home = the Explore wall. Same listing body as Search, Category, and Brand. */
export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: "Nav" });
  const tFilters = await getTranslations({ locale, namespace: "Filters" });
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

  const [brands, categories] = await Promise.allSettled([
    getBrands(),
    getCategories(),
  ]);
  const brandList = brands.status === "fulfilled" ? brands.value : [];
  const categoryList = categories.status === "fulfilled" ? categories.value : [];

  const query = {
    brand: current.brand || undefined,
    category: current.category || undefined,
    minPrice: toNumber(current.minPrice),
    maxPrice: toNumber(current.maxPrice),
    availability: current.availability as never,
    color: current.color || undefined,
    size: current.size || undefined,
    sort: toSort(sp.sort) ?? "newest",
    limit: 24,
  };
  const invalid = invalidPriceRange(query.minPrice, query.maxPrice);

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
        title={tNav("explore")}
        emptyTitle={tFilters("noMatches")}
        emptyHint={tFilters("adjust")}
        feed={{ kind: "products", query }}
      />
    );
  } catch (err) {
    body = <ErrorState error={err} />;
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
