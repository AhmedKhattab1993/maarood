import { ProductCard } from "./product-card";
import type { BrandSummary, PublicProduct } from "@/lib/api/types";
import {
  productItemClass,
  productListClass,
  type ProductLayout,
} from "./product-feed-layout";

export {
  productFeedItemClass,
  productFeedListClass,
  productGridItemClass,
  productGridListClass,
} from "./product-feed-layout";

/**
 * Product list. `layout="feed"` is the Following column. `layout="grid"` is
 * the catalog (Explore, search, brand, favourites).
 */
export function ProductGrid({
  products,
  brands,
  allSaved = false,
  savedIds,
  onUnsaved,
  hideAuthor = false,
  layout = "grid",
}: {
  products: PublicProduct[];
  brands?: BrandSummary[];
  /** Favourites: every row is already saved. */
  allSaved?: boolean;
  savedIds?: ReadonlySet<string>;
  /** Called when a row is unsaved (Favourites removes it from the list). */
  onUnsaved?: (productId: string) => void;
  /** Hide the author row (brand page already owns the brand identity). */
  hideAuthor?: boolean;
  layout?: ProductLayout;
}) {
  return (
    <ul className={productListClass(layout)}>
      {products.map((product, i) => (
        <li key={product.id} className={productItemClass(layout)}>
          <ProductCard
            product={product}
            brands={brands}
            priority={i < 4}
            initialSaved={allSaved || savedIds?.has(product.id) === true}
            onUnsaved={onUnsaved}
            hideAuthor={hideAuthor}
            layout={layout}
          />
        </li>
      ))}
    </ul>
  );
}

/** Skeleton matching the feed column or the catalog grid. */
export function ProductGridSkeleton({
  count = 8,
  layout = "grid",
}: {
  count?: number;
  layout?: ProductLayout;
}) {
  return (
    <ul className={productListClass(layout)}>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className={`${productItemClass(layout)} flex flex-col gap-2`}>
          {layout === "feed" && (
            <div className="flex items-center gap-3">
              <div className="maarood-skeleton h-10 w-10 shrink-0" />
              <div className="maarood-skeleton h-3 w-1/3" />
            </div>
          )}
          <div className="maarood-skeleton aspect-square w-full" />
          <div className="maarood-skeleton h-3 w-2/3" />
          <div className="maarood-skeleton h-3 w-1/4" />
        </li>
      ))}
    </ul>
  );
}
