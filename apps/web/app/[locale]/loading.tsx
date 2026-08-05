import { ProductGridSkeleton } from "@/components/product-grid";

/** Route-level loading fallback for the locale segment. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-10">
      <ProductGridSkeleton />
    </div>
  );
}
