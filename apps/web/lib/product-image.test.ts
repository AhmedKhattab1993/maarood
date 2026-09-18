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
});

describe("gallerySrcs", () => {
  it("keeps every http(s) URL in order for the product-detail gallery", () => {
    const urls = [
      "https://mobaco.com/wp-content/uploads/2025/10/JH098_918C_1.jpg",
      "https://cdn.shopify.com/s/files/1/x.jpg",
    ];
    expect(gallerySrcs(urls)).toEqual(urls);
    expect(gallerySrcs(["skip", ...urls])).toEqual(urls);
  });
});
