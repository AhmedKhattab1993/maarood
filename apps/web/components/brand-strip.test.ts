import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Explore shop-by-brand strip", () => {
  it("is gone: Explore does not import or render BrandStrip or shop-by-brand copy", () => {
    const page = readFileSync(
      new URL("../app/[locale]/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).not.toMatch(/BrandStrip/);
    expect(page).not.toMatch(/brand-strip/);
    expect(page).not.toMatch(/shopByBrand/);
    expect(page).not.toMatch(/browseBrands/);
    expect(page).toMatch(/ProductListing/);
    const feed = readFileSync(
      new URL("./discovery-feed.tsx", import.meta.url),
      "utf8",
    );
    expect(feed).toMatch(/ProductGrid/);
    expect(existsSync(new URL("./brand-strip.tsx", import.meta.url))).toBe(false);
  });
});
