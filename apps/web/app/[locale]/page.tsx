import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProducts, getBrands } from "@/lib/api/client";
import { ProductGrid } from "@/components/product-grid";
import { Pagination } from "@/components/pagination";
import { BrandStrip } from "@/components/brand-strip";
import { EmptyState, ErrorState } from "@/components/state-views";

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

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Home" });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 24;

  let result: Awaited<ReturnType<typeof getProducts>>;
  let brands: Awaited<ReturnType<typeof getBrands>> = [];
  try {
    [result, brands] = await Promise.all([
      getProducts({ sort: "newest", limit, page }),
      getBrands().catch(() => []),
    ]);
  } catch (err) {
    return <ErrorState error={err} />;
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:px-8 md:py-8">
      <BrandStrip brands={brands} />
      {result.items.length === 0 ? (
        <EmptyState title={t("heroSubtitle")} />
      ) : (
        <>
          <ProductGrid products={result.items} brands={brands} />
          <Pagination page={result.page} limit={result.limit} total={result.total} />
        </>
      )}
    </div>
  );
}
