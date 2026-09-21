import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrand, getCategories, getFacets } from "@/lib/api/client";
import { ProductListing } from "@/components/product-listing";
import { FacetNav } from "@/components/facet-nav";
import { FollowButton } from "@/components/follow-button";
import { ErrorState } from "@/components/state-views";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BrandAvatar } from "@/components/brand-avatar";
import { NotFoundError } from "@/lib/api/types";
import { categoryItems } from "@/lib/categories";
import { invalidPriceRange, toNumber, toSort } from "@/lib/query";
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
  } catch (err) {
    // Metadata resolves before streaming, so a 404 here carries the status.
    if (err instanceof NotFoundError) notFound();
    // keep slug as fallback title otherwise
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
  const tCat = await getTranslations({ locale, namespace: "Category" });

  const current = {
    brand: slug,
    category: str(sp.category),
    minPrice: str(sp.minPrice),
    maxPrice: str(sp.maxPrice),
    availability: str(sp.availability),
    color: str(sp.color),
    size: str(sp.size),
  };
  const productQuery = {
    category: current.category || undefined,
    minPrice: toNumber(current.minPrice),
    maxPrice: toNumber(current.maxPrice),
    availability: current.availability as never,
    color: current.color || undefined,
    size: current.size || undefined,
    sort: toSort(sp.sort),
    limit: 24,
  };
  const invalid = invalidPriceRange(productQuery.minPrice, productQuery.maxPrice);

  let body: React.ReactNode;
  // The slug is only a fallback when the brand record itself failed to load.
  let brandName = slug;
  try {
    const [{ brand, products }, brandCategories, facets] = await Promise.all([
      invalid
        ? getBrand(slug, { page: 1, limit: 24 }).then((data) => ({
            brand: data.brand,
            products: { items: [], page: 1, limit: 24, total: 0 },
          }))
        : getBrand(slug, { ...productQuery, page: 1 }),
      getCategories(slug).catch(() => []),
      getFacets({
        brand: slug,
        category: current.category || undefined,
      }).catch(() => ({ colors: [] as string[], sizes: [] as string[] })),
    ]);
    brandName = brand.name;

    body = (
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <BrandAvatar name={brand.name} logoUrl={brand.logoUrl} size={64} />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-ink-black">{brand.name}</h1>
              <a
                href={`https://${brand.domain}`}
                rel="noopener noreferrer"
                className="text-sm text-maaroud-blue hover:underline"
              >
                {t("Brand.website")} · {brand.domain} ↗
              </a>
            </div>
          </div>
          <FollowButton merchantId={brand.id} />
        </div>
        <FacetNav
          title={t("Brand.shopByCategory")}
          paramKey="category"
          activeValue={current.category || undefined}
          basePath={`/brands/${slug}`}
          baseQuery={withoutCategory(sp)}
          items={categoryItems(brandCategories, tCat).map((c) => ({
            label: c.label,
            count: c.count,
            value: c.value,
          }))}
        />
        <ProductListing
          result={products}
          brands={[
            {
              id: brand.id,
              name: brand.name,
              slug: brand.slug,
              domain: brand.domain,
              productCount: products.total,
              logoUrl: brand.logoUrl,
            },
          ]}
          current={current}
          sort={toSort(sp.sort) ?? "newest"}
          title={brand.name}
          heading="h2"
          hideAuthor
          emptyTitle={t("Search.noResults")}
          emptyHint={t("Search.noResultsHint")}
          facets={facets}
          feed={{
            kind: "brand",
            slug,
            query: { ...productQuery, sort: toSort(sp.sort) ?? "newest" },
          }}
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
          { label: brandName },
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
