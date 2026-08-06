import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProduct, getBrands, redirectHref } from "@/lib/api/client";
import { NotFoundError, type PublicProduct } from "@/lib/api/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SaveButton } from "@/components/save-button";
import { ErrorState } from "@/components/state-views";
import { ProductPrice } from "@/components/product-price";
import { ProductJsonLd } from "./product-jsonld";
import { formatPrice } from "@/lib/format";
import type { Variant } from "@/lib/api/types";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  try {
    const product = await getProduct(id);
    const images = product.imageUrls.slice(0, 5);
    return {
      title: product.title,
      description: product.description || undefined,
      openGraph: { images },
    };
  } catch {
    const t = await getTranslations({ locale, namespace: "Product" });
    return { title: t("notFound") };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  let product: PublicProduct;
  try {
    product = await getProduct(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    return (
      <div className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <ErrorState error={err} />
      </div>
    );
  }

  const brand = (await getBrands().catch(() => [])).find(
    (b) => b.id === product.merchantId,
  );
  const brandName = brand?.name ?? "";
  // vendor = the manufacturer/brand reported by the source (distinct from the
  // store). Prefer it for SEO structured-data brand when present.
  const vendorName = product.vendor || brandName;
  const discounted =
    product.previousPrice !== null && product.previousPrice > product.currentPrice;

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: t("Nav.home"), href: { pathname: "/" } },
          ...(brand
            ? [
                {
                  label: brand.name,
                  href: {
                    pathname: "/brands/[slug]",
                    params: { slug: brand.slug },
                  } as const,
                },
              ]
            : []),
          { label: product.title },
        ]}
      />

      <ProductJsonLd product={product} brandName={vendorName} />

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <Gallery imageUrls={product.imageUrls} title={product.title} />

        <div className="flex flex-col gap-4">
          {vendorName && (
            <span className="text-sm uppercase tracking-wide text-cool-grey">
              {vendorName}
            </span>
          )}
          <h1 className="text-2xl font-semibold text-ink-black md:text-3xl">
            {product.title}
          </h1>

          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold text-ink-black">
              <ProductPrice amount={product.currentPrice} currency={product.currency} />
            </span>
            {discounted && (
              <>
                <span className="text-base text-cool-grey line-through">
                  <ProductPrice
                    amount={product.previousPrice as number}
                    currency={product.currency}
                  />
                </span>
                <span className="text-sm font-medium text-alert-red">
                  {t("Product.onSale", {
                    percent: Math.round(
                      (1 - product.currentPrice / (product.previousPrice as number)) * 100,
                    ),
                  })}
                </span>
              </>
            )}
          </div>

          {product.availability === "out_of_stock" && (
            <p className="text-sm font-medium text-alert-red">
              {t("Product.outOfStock")}
            </p>
          )}
          {product.stale && (
            <p className="text-sm text-cool-grey">{t("Product.stale")}</p>
          )}

          {/* Structured option groups (Size: S M L, Color: Black White) */}
          {product.options.length > 0 && (
            <div className="flex flex-col gap-2 text-sm">
              {product.options.map((o) => (
                <DetailRow key={o.name} label={o.name} value={o.values.join(" · ")} />
              ))}
            </div>
          )}

          {/* Per-variant table: size + price + struck original + availability */}
          <VariantTable
            variants={product.variants}
            currency={product.currency}
            locale={locale}
            labels={{
              heading: t("Product.sizeAndAvailability"),
              sizes: t("Product.sizes"),
              price: t("Product.priceLabel"),
              availability: t("Product.availabilityLabel"),
              inStock: t("Product.inStock"),
              outOfStock: t("Product.outOfStock"),
              unknown: t("Product.unknown"),
            }}
          />

          {product.description && (
            <p className="max-w-prose whitespace-pre-line text-sm text-ink-black md:text-base">
              {product.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {/* Outbound click = primary success metric (08:85). The backend
                redirect endpoint logs the click then 302s to the merchant. */}
            {product.redirectUrl ? (
              <a
                href={redirectHref(product.id)}
                rel="noopener noreferrer nofollow"
                className="rounded-default bg-maaroud-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo"
              >
                {t("Product.buyFromBrand")}
              </a>
            ) : null}
            <SaveButton productId={product.id} variant="label" />
          </div>

          {brandName && (
            <p className="text-xs text-cool-grey">
              {t("Product.checkoutAt", { brand: brandName })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-20 text-cool-grey">{label}</span>
      <span className="text-ink-black">{value}</span>
    </div>
  );
}

/**
 * Per-variant table — size + this variant's price + struck original (when
 * discounted) + per-variant availability. Only renders when variants carry
 * meaningful per-variant data (a size or price), so simple single-price
 * products with no variants don't show an empty table.
 */
function VariantTable({
  variants,
  currency,
  locale,
  labels,
}: {
  variants: Variant[];
  currency: string;
  locale: string;
  labels: {
    heading: string;
    sizes: string;
    price: string;
    availability: string;
    inStock: string;
    outOfStock: string;
    unknown: string;
  };
}) {
  // Show only variants that carry a size (the meaningful per-variant axis here).
  const rows = variants.filter((v) => v.size);
  if (rows.length === 0) return null;

  return (
    <div className="border-t border-stone-grey pt-4">
      <h2 className="mb-3 text-sm font-medium text-ink-black">{labels.heading}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-grey text-left text-cool-grey">
            <th className="py-2 font-normal">{labels.sizes}</th>
            <th className="py-2 font-normal">{labels.price}</th>
            <th className="py-2 font-normal">{labels.availability}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v, i) => {
            const discounted =
              v.compareAtPrice !== null &&
              v.compareAtPrice !== undefined &&
              v.price !== undefined &&
              v.compareAtPrice > v.price;
            return (
              <tr key={`${v.label}-${i}`} className="border-b border-stone-grey">
                <td className="py-2 text-ink-black">{v.size}</td>
                <td className="py-2">
                  {v.price !== undefined ? (
                    <span className="flex items-baseline gap-2">
                      <span className="text-ink-black">
                        {formatPrice(v.price, currency, locale)}
                      </span>
                      {discounted && (
                        <span className="text-xs text-cool-grey line-through">
                          {formatPrice(v.compareAtPrice as number, currency, locale)}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-cool-grey">—</span>
                  )}
                </td>
                <td className="py-2">
                  {v.availability === "in_stock" ? (
                    <span className="text-success-green">{labels.inStock}</span>
                  ) : v.availability === "out_of_stock" ? (
                    <span className="text-alert-red">{labels.outOfStock}</span>
                  ) : (
                    <span className="text-cool-grey">{labels.unknown}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Gallery({
  imageUrls,
  title,
}: {
  imageUrls: string[];
  title: string;
}) {
  if (imageUrls.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-stone-grey text-cool-grey">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {/* Merchant CDN imagery (06:49 — preserve original URLs). Plain <img>
          with unoptimized loading to avoid Next image optimizer round-trips for
          arbitrary merchant hosts. */}
      <img
        src={imageUrls[0]}
        alt={title}
        className="aspect-[4/5] w-full object-cover"
      />
      {imageUrls.length > 1 && (
        <ul className="grid grid-cols-4 gap-2">
          {imageUrls.slice(1, 9).map((src, i) => (
            <li key={i}>
              <img
                src={src}
                alt={`${title} ${i + 2}`}
                className="aspect-square w-full rounded bg-stone-grey object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
