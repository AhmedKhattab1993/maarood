import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { BrandSummary } from "@/lib/api/types";

/** Horizontal list of brands on Explore so stores are visible without /brands. */
export async function BrandStrip({ brands }: { brands: BrandSummary[] }) {
  const t = await getTranslations("Home");
  if (brands.length === 0) return null;

  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cool-grey">
          {t("shopByBrand")}
        </h2>
        <Link
          href={{ pathname: "/brands" }}
          className="text-sm text-cool-grey transition-colors hover:text-ink-black"
        >
          {t("browseBrands")}
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {sorted.map((b) => (
          <li key={b.id}>
            <Link
              href={{ pathname: "/brands/[slug]", params: { slug: b.slug } }}
              className="inline-flex items-center gap-1.5 border border-stone-grey bg-white px-3 py-1.5 text-sm text-ink-black transition-colors hover:border-ink-black"
            >
              <span>{b.name}</span>
              <span className="text-xs text-cool-grey">{b.productCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
