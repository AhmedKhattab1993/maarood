import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrand, getCategories } from "@/lib/api/client";
import { ProductListing } from "@/components/product-listing";
import { FacetNav } from "@/components/facet-nav";
import { FollowButton } from "@/components/follow-button";
import { ErrorState } from "@/components/state-views";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NotFoundError } from "@/lib/api/types";
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
  try {
    const [{ brand, products }, brandCategories] = await Promise.all([
      invalid
        ? getBrand(slug, { page: 1, limit: 24 }).then((data) => ({
            brand: data.brand,
            products: { items: [], page: 1, limit: 24, total: 0 },
          }))
        : getBrand(slug, { ...productQuery, page: 1 }),
      getCategories(slug).catch(() => []),
    ]);

    body = (
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt=""
                width={64}
                height={64}
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 bg-white object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-16 w-16 shrink-0 items-center justify-center bg-stone-grey text-lg font-semibold text-ink-black"
              >
                {brand.name.trim().charAt(0)}
              </span>
            )}
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
          items={brandCategories.map((c) => ({
            label: c.name,
            count: c.productCount,
            value: c.name,
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
          emptyTitle={t("Search.noResults")}
          emptyHint={t("Search.noResultsHint")}
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
