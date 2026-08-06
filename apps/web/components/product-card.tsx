import { useLocale, useTranslations } from "next-intl";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import type { BrandSummary, PublicProduct } from "@/lib/api/types";

interface ProductCardProps {
  product: PublicProduct;
  /** Brand lookup so the card can show attribution (04:80). */
  brands?: BrandSummary[];
  /** Priority loading for above-the-fold cards. */
  priority?: boolean;
}

/**
 * Uniform product card — Nike-style discovery look: square 1:1 image on a
 * transparent (page-color) tile, square corners, tight meta. Title is regular
 * weight at 16px; brand subtitle in Nike's neutral grey (#707072).
 */
export function ProductCard({ product, brands, priority }: ProductCardProps) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const brand = brands?.find((b) => b.id === product.merchantId);
  const cover = product.imageUrls[0];

  const discounted =
    product.previousPrice !== null && product.previousPrice > product.currentPrice;

  return (
    <Link
      href={{ pathname: "/p/[id]", params: { id: product.id } }}
      className="group flex flex-col"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {cover ? (
          <NextImage
            src={cover}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
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
        {brand && (
          <span className="text-[0.6875rem] uppercase tracking-wide text-nike-grey">
            {brand.name}
          </span>
        )}
        <h3 className="line-clamp-1 text-base font-normal text-ink-black">
          {product.title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-normal text-ink-black">
            {formatPrice(product.currentPrice, product.currency, locale)}
          </span>
          {discounted && (
            <span className="text-sm text-cool-grey line-through">
              {formatPrice(product.previousPrice as number, product.currency, locale)}
            </span>
          )}
        </div>
      </div>
    </Link>
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
