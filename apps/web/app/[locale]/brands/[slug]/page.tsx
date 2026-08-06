import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrand, getCategories } from "@/lib/api/client";
import { ProductListing } from "@/components/product-listing";
import { FacetNav } from "@/components/facet-nav";
import { ErrorState } from "@/components/state-views";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NotFoundError } from "@/lib/api/types";
import { toNumber, toSort } from "@/lib/query";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  let name = slug;
  try {
    const { brand } = await getBrand(slug);
    name = brand.name;
  } catch {
    // keep slug as fallback title
  }
  return { title: t("brandTitle", { brand: name }) };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations({ locale });

  const current = {
    brand: slug,
    category: str(sp.category),
    minPrice: str(sp.minPrice),
    maxPrice: str(sp.maxPrice),
    availability: str(sp.availability),
    color: str(sp.color),
    size: str(sp.size),
  };

  let body: React.ReactNode;
  try {
    const [{ brand, products }, brandCategories] = await Promise.all([
      getBrand(slug, {
        category: current.category,
        minPrice: toNumber(current.minPrice),
        maxPrice: toNumber(current.maxPrice),
        availability: current.availability as never,
        color: current.color,
        size: current.size,
        sort: toSort(sp.sort),
        page: toNumber(sp.page) ?? 1,
        limit: 24,
      }),
      getCategories(slug).catch(() => []),
    ]);

    body = (
      <>
        <header className="mb-6 flex flex-col gap-2 border-b border-stone-grey pb-6">
          <h1 className="text-2xl font-semibold text-ink-black md:text-3xl">
            {brand.name}
          </h1>
          <a
            href={`https://${brand.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-maaroud-blue hover:underline"
          >
            {brand.domain} ↗
          </a>
        </header>
        <FacetNav
          title={t("Brand.shopByCategory")}
          paramKey="category"
          activeValue={current.category || undefined}
          basePath={`/brands/${slug}`}
          baseQuery={withoutCategory(sp)}
          items={brandCategories.map((c) => ({
            label: c.name,
            count: c.productCount,
            value: c.name,
          }))}
        />
        <ProductListing
          result={products}
          current={current}
          sort={toSort(sp.sort) ?? "newest"}
          emptyTitle={t("Search.noResults")}
          emptyHint={t("Search.noResultsHint")}
        />
      </>
    );
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    body = <ErrorState error={err} />;
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: t("Nav.home"), href: { pathname: "/" } },
          { label: t("Nav.brands"), href: { pathname: "/brands" } },
          { label: slug },
        ]}
      />
      <div className="mt-4">{body}</div>
    </div>
  );
}

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

/** Build a query object from the raw params, excluding the category key. */
function withoutCategory(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (k === "category") continue;
    out[k] = str(v);
  }
  return out;
}
