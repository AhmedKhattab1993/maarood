import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProducts, getBrands, getCategories } from "@/lib/api/client";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeader } from "@/components/section-header";
import { EmptyState, ErrorState } from "@/components/state-views";
import { Link } from "@/i18n/navigation";
import { categoryName } from "@/lib/categories";

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
  const tCat = await getTranslations({ locale, namespace: "Category" });
  const tBrand = await getTranslations({ locale, namespace: "Brand" });

  let newest: Awaited<ReturnType<typeof getProducts>>;
  try {
    newest = await getProducts({ sort: "newest", limit: 12 });
  } catch (err) {
    return <ErrorState error={err} />;
  }

  const [brands, categories] = await Promise.allSettled([getBrands(), getCategories()]);
  const brandList = brands.status === "fulfilled" ? brands.value : [];
  const categoryList = categories.status === "fulfilled" ? categories.value : [];

  return (
    <div>
      {/* Hero — full-bleed, Nike-style. Neutral brand-colored block (no external asset). */}
      <section className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden bg-ink-black text-white md:aspect-[21/9]">
        <div className="flex flex-col items-center gap-4 px-4 text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-prose text-base text-white/80 md:text-lg">
            {t("heroSubtitle")}
          </p>
          <Link
            href={{ pathname: "/search", query: { sort: "newest" } }}
            className="mt-2 border border-white bg-white px-6 py-2.5 text-sm font-medium text-ink-black transition-colors hover:bg-transparent hover:text-white"
          >
            {t("heroCta")}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-max)] px-4 md:px-8">
        {/* Shop by category — Nike-style square tiles */}
        {categoryList.length > 0 && (
          <section className="py-10 md:py-14">
            <SectionHeader title={t("shopByCategory")} />
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {categoryList.map((c) => (
                <li key={c.name}>
                  <Link
                    href={{ pathname: "/c/[category]", params: { category: c.name } }}
                    className="group relative flex aspect-square w-full items-end overflow-hidden bg-stone-grey p-4"
                  >
                    <span className="relative z-10 text-lg font-semibold text-ink-black">
                      {categoryName(c.name, tCat)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* New arrivals grid */}
        <section className="pb-10 md:pb-14">
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

        {/* Shop by brand — horizontal scroll strip */}
        {brandList.length > 0 && (
          <section className="pb-12">
            <SectionHeader title={t("shopByBrand")} viewAllHref={{ pathname: "/brands" }} />
            <ul className="flex gap-3 overflow-x-auto pb-2">
              {brandList.map((b) => (
                <li key={b.id} className="shrink-0">
                  <Link
                    href={{ pathname: "/brands/[slug]", params: { slug: b.slug } }}
                    className="flex h-32 w-48 flex-col justify-between border border-stone-grey bg-white p-4 transition-colors hover:border-ink-black"
                  >
                    <span className="text-base font-semibold text-ink-black">{b.name}</span>
                    <span className="text-xs text-cool-grey">
                      {tBrand("productsCount", { count: b.productCount })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
