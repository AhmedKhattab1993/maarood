import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrands } from "@/lib/api/client";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState, ErrorState } from "@/components/state-views";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("brandsTitle") };
}

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  let brands: Awaited<ReturnType<typeof getBrands>>;
  try {
    brands = await getBrands();
  } catch (err) {
    return (
      <div className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <ErrorState error={err} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: t("Nav.home"), href: { pathname: "/" } },
          { label: t("Nav.brands") },
        ]}
      />
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-ink-black md:text-3xl">
        {t("Nav.brands")}
      </h1>
      {brands.length === 0 ? (
        <EmptyState title={t("Saved.empty")} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((b) => (
            <li key={b.id}>
              <Link
                href={{ pathname: "/brands/[slug]", params: { slug: b.slug } }}
                className="flex h-full flex-col justify-between rounded-md border border-stone-grey bg-white p-4 text-ink-black transition-colors hover:border-ink-black"
              >
                <span className="text-base font-semibold">{b.name}</span>
                <span className="mt-1 text-xs text-cool-grey">
                  {t("Brand.productsCount", { count: b.productCount })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
