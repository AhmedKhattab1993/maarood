"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { coverSrc } from "@/lib/product-image";
import type { BrandSummary, PublicProduct } from "@/lib/api/types";
import { SaveButton } from "./save-button";
import { FollowButton } from "./follow-button";

interface ProductCardProps {
  product: PublicProduct;
  /** Brand lookup so the post can show the merchant as the author. */
  brands?: BrandSummary[];
  /** Priority loading for above-the-fold cards. */
  priority?: boolean;
}

/**
 * Stacked product post: X-style author row (brand as the poster) then the
 * product image, title, and price as the body.
 */
export function ProductCard({ product, brands, priority }: ProductCardProps) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const brand = brands?.find((b) => b.id === product.merchantId);
  const [logoFailed, setLogoFailed] = useState(false);
  const cover = coverSrc(product.imageUrls);

  const discounted =
    product.previousPrice !== null && product.previousPrice > product.currentPrice;

  return (
    <article className="flex w-full flex-col">
      <header className="mb-3 flex items-center justify-between gap-3">
        {brand ? (
          <Link
            href={{ pathname: "/brands/[slug]", params: { slug: brand.slug } }}
            className="flex min-w-0 items-center gap-3"
          >
            {brand.logoUrl && !logoFailed ? (
              // Plain <img> to the merchant CDN — Next's optimizer 400s on
              // arbitrary Shopify/Woo/Magento hosts (`/_next/image?url=...`).
              <img
                src={brand.logoUrl}
                alt=""
                width={40}
                height={40}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-10 w-10 shrink-0 bg-white object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-stone-grey text-sm font-semibold text-ink-black"
              >
                {brand.name.trim().charAt(0)}
              </span>
            )}
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-ink-black">
                {brand.name}
              </span>
              <span className="truncate text-xs text-cool-grey" dir="ltr">
                {`@${brand.slug}`}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        <FollowButton merchantId={product.merchantId} />
      </header>

      <Link
        href={{ pathname: "/p/[id]", params: { id: product.id } }}
        className="group flex w-full flex-col"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-stone-grey">
          {cover ? (
            // Plain <img> to the merchant CDN — Next's optimizer 400s on
            // arbitrary Shopify/Woo hosts (`/_next/image?url=...`).
            <img
              src={cover}
              alt={product.title}
              fetchPriority={priority ? "high" : undefined}
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-cool-grey">
              <PlaceholderIcon />
            </div>
          )}
          {product.availability === "out_of_stock" && (
            <Badge tone="muted">{t("outOfStock")}</Badge>
          )}
          {product.stale && (
            <Badge tone="alert">{t("stale")}</Badge>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-0.5">
          <h3 className="line-clamp-1 text-base font-normal text-ink-black">
            {product.title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-normal text-ink-black">
              {formatPrice(product.currentPrice, product.currency, locale)}
            </span>
            {discounted && (
              <>
                <span className="text-sm text-cool-grey line-through">
                  {formatPrice(product.previousPrice as number, product.currency, locale)}
                </span>
                <span className="text-xs font-medium text-alert-red">
                  -{Math.round((1 - product.currentPrice / (product.previousPrice as number)) * 100)}%
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-2">
        <SaveButton productId={product.id} />
      </div>
    </article>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "muted" | "alert";
  children: React.ReactNode;
}) {
  const cls =
    tone === "alert"
      ? "bg-alert-red text-white"
      : "bg-ink-black text-white";
  return (
    <span
      className={`absolute start-2 top-2 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );
}

function PlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
