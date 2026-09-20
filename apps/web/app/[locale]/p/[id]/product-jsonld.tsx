import type { PublicProduct } from "@/lib/api/types";
import { shoppingDestination } from "@/lib/shopping-destination";

/**
 * JSON-LD Product schema for SEO (06:14 — SEO-friendly product pages). Inlined
 * rather than via a dependency to keep the bundle lean.
 */
export function ProductJsonLd({
  product,
  brandName,
}: {
  product: PublicProduct;
  brandName: string;
}) {
  const dest = shoppingDestination(product.redirectUrl);
  const availability =
    product.availability === "in_stock"
      ? "https://schema.org/InStock"
      : product.availability === "out_of_stock"
        ? "https://schema.org/OutOfStock"
        : undefined;
  const offers =
    product.currentPrice || dest.ok
      ? {
          "@type": "Offer",
          price: product.currentPrice,
          priceCurrency: product.currency,
          availability,
          url: dest.ok ? dest.url : undefined,
        }
      : undefined;

  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.imageUrls,
    brand: brandName ? { "@type": "Brand", name: brandName } : undefined,
    category: product.category || undefined,
    offers,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
