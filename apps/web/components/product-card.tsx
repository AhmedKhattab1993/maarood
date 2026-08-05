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
 * Uniform product card — consistent aspect ratio, spacing, typography, and
 * metadata placement per 04:78. SSENSE-restrained: neutral chrome, product
 * imagery carries the color.
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
      href={{ pathname: "/p/[id]", query: { id: product.id } }}
      className="group flex flex-col"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-stone-grey">
        {cover ? (
          <NextImage
            src={cover}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
          <span className="text-xs uppercase tracking-wide text-cool-grey">
            {brand.name}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-ink-black">
          {product.title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink-black">
            {formatPrice(product.currentPrice, product.currency, locale)}
          </span>
          {discounted && (
            <span className="text-xs text-cool-grey line-through">
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
      ? "bg-alert-red/90 text-white"
      : "bg-ink-black/70 text-white";
  return (
    <span
      className={`absolute end-2 top-2 rounded-pill px-2 py-0.5 text-[0.625rem] font-medium ${cls}`}
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
