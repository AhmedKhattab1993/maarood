import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProducts, getBrands, getCategories } from "@/lib/api/client";
import { ProductListing } from "@/components/product-listing";
import { FacetNav } from "@/components/facet-nav";
import { ErrorState } from "@/components/state-views";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { toNumber, toSort } from "@/lib/query";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("categoryTitle", { category: decodeCategory(category) }) };
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

  const [brands, categories] = await Promise.allSettled([
    getBrands(categoryValue),
    getCategories(),
  ]);
  const brandList = brands.status === "fulfilled" ? brands.value : [];
  const categoryList = categories.status === "fulfilled" ? categories.value : [];

  let body: React.ReactNode;
  try {
    const result = await getProducts({
      category: categoryValue,
      brand: current.brand,
      minPrice: toNumber(current.minPrice),
      maxPrice: toNumber(current.maxPrice),
      availability: current.availability as never,
      color: current.color,
      size: current.size,
      sort: toSort(sp.sort) ?? "newest",
      page: toNumber(sp.page) ?? 1,
      limit: 24,
    });
    body = (
      <>
        <FacetNav
          title={t("Category.brandsIn", { category: categoryValue })}
          paramKey="brand"
          activeValue={current.brand || undefined}
          basePath={`/c/${categoryValue}`}
          baseQuery={withoutBrand(sp)}
          items={brandList.map((b) => ({
            label: b.name,
            count: b.productCount,
            value: b.slug,
          }))}
        />
        <ProductListing
          result={result}
          brands={brandList}
          categories={categoryList}
          current={current}
          sort={toSort(sp.sort) ?? "newest"}
          emptyTitle={t("Search.noResults")}
          emptyHint={t("Search.noResultsHint")}
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
          { label: t("Nav.home"), href: { pathname: "/" } },
          { label: categoryValue },
        ]}
      />
      <h1 className="mb-6 mt-2 text-2xl font-semibold capitalize text-ink-black md:text-3xl">
        {categoryValue}
      </h1>
      {body}
    </div>
  );
}

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

/** Build a query object from the raw params, excluding the brand key. */
function withoutBrand(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (k === "brand") continue;
    out[k] = str(v);
  }
  return out;
}

/** Category in the URL may be the raw value or kebab-encoded. */
function decodeCategory(category: string): string {
  try {
    return decodeURIComponent(category);
  } catch {
    return category;
  }
}
