import { ProductCard } from "./product-card";
import type { BrandSummary, PublicProduct } from "@/lib/api/types";

/**
 * Responsive product grid — Nike-style discovery: dense, square-cornered tiles.
 * Column count depends on viewport AND whether the filter rail is open (Nike
 * shows more columns when filters are hidden, fewer when the rail takes width).
 * `priority` is set on the first few cards to prioritize LCP image loading.
 *
 * dense = rail closed → more columns; rail open → fewer columns.
 */
export function ProductGrid({
  products,
  brands,
  dense = false,
}: {
  products: PublicProduct[];
  brands?: BrandSummary[];
  /** When true (filter rail closed), show extra columns. */
  dense?: boolean;
}) {
  // Rail open (not dense): 2 / 3 / 3 cols. Rail closed (dense): 2 / 3 / 4 cols.
  const cols = dense
    ? "grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    : "grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3";
  return (
    <ul className={`grid ${cols}`}>
      {products.map((product, i) => (
        <li key={product.id}>
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

/** Skeleton grid for loading states. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex flex-col gap-2">
          <div className="maarood-skeleton aspect-square w-full" />
          <div className="maarood-skeleton h-3 w-1/3" />
          <div className="maarood-skeleton h-3 w-2/3" />
          <div className="maarood-skeleton h-3 w-1/4" />
        </li>
      ))}
    </ul>
  );
}
