import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProducts, getBrands, getCategories } from "@/lib/api/client";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeader } from "@/components/section-header";
import { EmptyState, ErrorState } from "@/components/state-views";
import { Link } from "@/i18n/navigation";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });

  let newest: Awaited<ReturnType<typeof getProducts>>;
  try {
    newest = await getProducts({ sort: "newest", limit: 12 });
  } catch (err) {
    return <ErrorState error={err} />;
  }

  // Brands + categories are non-critical; don't fail the home page if they 500.
  const [brands, categories] = await Promise.allSettled([getBrands(), getCategories()]);
  const brandList = brands.status === "fulfilled" ? brands.value : [];
  const categoryList = categories.status === "fulfilled" ? categories.value : [];

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      {/* Hero — restrained, gallery-like. Aritzia storytelling reference. */}
      <section className="mb-10 flex flex-col gap-3 border-b border-stone-grey pb-10 text-center md:mb-14">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-black md:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto max-w-prose text-base text-cool-grey md:text-lg">
          {t("heroSubtitle")}
        </p>
      </section>

      {/* Categories chips */}
      {categoryList.length > 0 && (
        <section className="mb-10">
          <SectionHeader title={t("browseCategories")} />
          <ul className="flex flex-wrap gap-2">
            {categoryList.map((c) => (
              <li key={c.name}>
                <Link
                  href={{ pathname: "/c/[category]", query: { category: c.name } }}
                  className="rounded-pill border border-stone-grey bg-white px-4 py-2 text-sm capitalize text-ink-black transition-colors hover:border-ink-black"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* New arrivals */}
      <section className="mb-12">
        <SectionHeader
          title={t("newArrivals")}
          viewAllHref={{ pathname: "/search", query: { sort: "newest" } }}
        />
        {newest.items.length === 0 ? (
          <EmptyState title={t("heroSubtitle")} />
        ) : (
          <ProductGrid products={newest.items} brands={brandList} />
        )}
      </section>

      {/* Brands index teaser */}
      {brandList.length > 0 && (
        <section className="mb-6">
          <SectionHeader title={t("browseBrands")} viewAllHref={{ pathname: "/brands" }} />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {brandList.slice(0, 8).map((b) => (
              <li key={b.id}>
                <Link
                  href={{ pathname: "/brands/[slug]", query: { slug: b.slug } }}
                  className="flex items-center justify-between rounded-md border border-stone-grey bg-white px-4 py-3 text-sm text-ink-black transition-colors hover:border-ink-black"
                >
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xs text-cool-grey">{b.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
