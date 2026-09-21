import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProducts, getBrands, getCategories } from "@/lib/api/client";
import { ExploreControls } from "@/components/explore-controls";
import { DiscoveryFeed } from "@/components/discovery-feed";
import { EmptyState, ErrorState } from "@/components/state-views";
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

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tFilters = await getTranslations({ locale, namespace: "Filters" });
  const sp = await searchParams;
  const current = {
    category: sp.category || "",
    minPrice: sp.minPrice || "",
    maxPrice: sp.maxPrice || "",
  };
  const category = current.category || undefined;
  const minPrice = toNumber(current.minPrice);
  const maxPrice = toNumber(current.maxPrice);
  const sort = toSort(sp.sort) ?? "newest";
  const invalid = invalidPriceRange(minPrice, maxPrice);
  const limit = 24;
  const query = {
    sort,
    limit,
    category,
    minPrice,
    maxPrice,
  };

  const [brands, categories] = await Promise.all([
    getBrands().catch(() => []),
    getCategories().catch(() => []),
  ]);

  let body: React.ReactNode;
  if (invalid) {
    body = null;
  } else {
    try {
      const result = await getProducts({ ...query, page: 1 });
      body =
        result.items.length === 0 ? (
          <EmptyState
            title={tFilters("noMatches")}
            hint={tFilters("adjust")}
          />
        ) : (
          <DiscoveryFeed
            initial={result}
            brands={brands}
            source={{ kind: "products", query }}
          />
        );
    } catch (err) {
      body = <ErrorState error={err} />;
    }
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:px-8 md:py-8">
      <ExploreControls categories={categories} current={current} sort={sort} />
      {body}
    </div>
  );
}
