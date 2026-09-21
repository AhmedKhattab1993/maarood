import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { coverSrc, gallerySrcs } from "./product-image";

describe("coverSrc", () => {
  it("returns the first http(s) URL as the listing/detail image src", () => {
    const src = coverSrc([
      "https://cdn.shopify.com/s/files/1/0736/3123/6396/files/342234.jpg?v=1700580525",
      "https://cdn.shopify.com/s/files/1/0736/3123/6396/files/other.jpg",
    ]);
    expect(src).toMatch(/^https?:\/\//);
    expect(src).toBe(
      "https://cdn.shopify.com/s/files/1/0736/3123/6396/files/342234.jpg?v=1700580525",
    );
  });

  it("returns null when there are no usable URLs (placeholder-only tile)", () => {
    expect(coverSrc([])).toBeNull();
    expect(coverSrc(undefined)).toBeNull();
    expect(coverSrc(["/local.jpg", ""])).toBeNull();
  });

  it("never uses a size-chart / measurement plate as the cover", () => {
    const chart =
      "https://mobaco.hypernode.io/media/catalog/product/p/r/product_measurements_246.jpg";
    const body =
      "https://mobaco.hypernode.io/media/catalog/product/b/o/body_image_209.jpg";
    const still =
      "https://mobaco.hypernode.io/media/catalog/product/l/l/ll350_0020_f01.jpg";
    expect(coverSrc([chart, body, still])).toBe(body);
    expect(coverSrc([chart])).toBeNull();
  });
});

describe("gallerySrcs", () => {
  it("keeps every http(s) URL, with size charts after product photos", () => {
    const still =
      "https://mobaco.hypernode.io/media/catalog/product/l/l/ll350_0020_f01.jpg";
    const chart =
      "https://mobaco.hypernode.io/media/catalog/product/p/r/product_measurements_246.jpg";
    const body =
      "https://mobaco.hypernode.io/media/catalog/product/b/o/body_image_209.jpg";
    expect(gallerySrcs([chart, body, still])).toEqual([body, still, chart]);
  });
});

describe("card imagery", () => {
  it("crops listing covers and keeps the full photo on the product page", () => {
    const card = readFileSync(
      new URL("../components/product-card.tsx", import.meta.url),
      "utf8",
    );
    const gallery = readFileSync(
      new URL("../components/product-gallery.tsx", import.meta.url),
      "utf8",
    );
    expect(card).toMatch(/coverSrc\(product\.imageUrls\)/);
    expect(card).toMatch(/object-cover/);
    expect(card).not.toMatch(/object-contain/);
    expect(gallery).toMatch(/object-contain/);
    expect(gallery).not.toMatch(/object-cover/);
  });
});
