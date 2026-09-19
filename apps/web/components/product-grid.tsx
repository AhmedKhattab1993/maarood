import { ProductCard } from "./product-card";
import type { BrandSummary, PublicProduct } from "@/lib/api/types";
import {
  productFeedItemClass,
  productFeedListClass,
} from "./product-feed-layout";

export { productFeedItemClass, productFeedListClass } from "./product-feed-layout";

/**
 * Vertical product feed (X / Instagram-style stack). Card chrome stays on
 * ProductCard; this wrapper only changes how items are laid out.
 * `priority` is set on the first few cards to prioritize LCP image loading.
 */
export function ProductGrid({
  products,
  brands,
}: {
  products: PublicProduct[];
  brands?: BrandSummary[];
}) {
  return (
    <ul className={productFeedListClass()}>
      {products.map((product, i) => (
        <li key={product.id} className={productFeedItemClass()}>
          <ProductCard
            product={product}
            brands={brands}
            priority={i < 4}
          />
        </li>
      ))}
    </ul>
  );
}

/** Skeleton feed for loading states — same single-column structure. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className={productFeedListClass()}>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className={`${productFeedItemClass()} flex flex-col gap-2`}>
          <div className="flex items-center gap-3">
            <div className="maarood-skeleton h-10 w-10 shrink-0" />
            <div className="maarood-skeleton h-3 w-1/3" />
          </div>
          <div className="maarood-skeleton aspect-square w-full" />
          <div className="maarood-skeleton h-3 w-2/3" />
          <div className="maarood-skeleton h-3 w-1/4" />
        </li>
      ))}
    </ul>
  );
}
