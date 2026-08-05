import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProduct, getBrands, redirectHref } from "@/lib/api/client";
import { NotFoundError, type PublicProduct } from "@/lib/api/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SaveButton } from "@/components/save-button";
import { ErrorState } from "@/components/state-views";
import { ProductPrice } from "@/components/product-price";
import { ProductJsonLd } from "./product-jsonld";
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

      <ProductJsonLd product={product} brandName={brandName} />

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <Gallery imageUrls={product.imageUrls} title={product.title} />

        <div className="flex flex-col gap-4">
          {brandName && (
            <span className="text-sm uppercase tracking-wide text-cool-grey">
              {brandName}
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
              <span className="text-base text-cool-grey line-through">
                <ProductPrice
                  amount={product.previousPrice as number}
                  currency={product.currency}
                />
              </span>
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

          {product.description && (
            <p className="max-w-prose whitespace-pre-line text-sm text-ink-black md:text-base">
              {product.description}
            </p>
          )}

          {(product.sizes.length > 0 || product.colors.length > 0) && (
            <div className="flex flex-col gap-2 text-sm">
              {product.sizes.length > 0 && (
                <DetailRow label={t("Product.sizes")} value={product.sizes.join(" · ")} />
              )}
              {product.colors.length > 0 && (
                <DetailRow label={t("Product.colors")} value={product.colors.join(" · ")} />
              )}
            </div>
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

function Gallery({
  imageUrls,
  title,
}: {
  imageUrls: string[];
  title: string;
}) {
  if (imageUrls.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-md bg-stone-grey text-cool-grey">
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
        className="aspect-[4/5] w-full rounded-md bg-stone-grey object-cover"
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
