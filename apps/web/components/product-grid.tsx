import { ProductCard } from "./product-card";
import type { BrandSummary, PublicProduct } from "@/lib/api/types";

/**
 * Responsive product grid — Nike-style discovery: dense, square-cornered tiles.
 * 2 cols mobile, 3–4 desktop. `priority` is set on the first few cards to
 * prioritize LCP image loading.
 */
export function ProductGrid({
  products,
  brands,
}: {
  products: PublicProduct[];
  brands?: BrandSummary[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-2 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
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
          <div className="maarood-skeleton aspect-[3/4] w-full" />
          <div className="maarood-skeleton h-3 w-1/3" />
          <div className="maarood-skeleton h-3 w-2/3" />
          <div className="maarood-skeleton h-3 w-1/4" />
        </li>
      ))}
    </ul>
  );
}
