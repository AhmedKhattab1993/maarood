import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const card = readFileSync(new URL("./product-card.tsx", import.meta.url), "utf8");
const explore = readFileSync(
  new URL("../app/[locale]/page.tsx", import.meta.url),
  "utf8",
);

describe("product post author row", () => {
  it("places brand identity and Follow in a header before the cover image", () => {
    const header = card.indexOf("<header");
    const name = card.indexOf("{brand.name}");
    const follow = card.indexOf("<FollowButton");
    const headerEnd = card.indexOf("</header>");
    const img = card.indexOf("<img");
    expect(header).toBeGreaterThan(-1);
    expect(name).toBeGreaterThan(header);
    expect(follow).toBeGreaterThan(header);
    expect(follow).toBeLessThan(headerEnd);
    expect(name).toBeLessThan(headerEnd);
    expect(headerEnd).toBeLessThan(img);
    expect(follow).toBeLessThan(img);
    expect(name).toBeLessThan(img);
    expect(card.match(/<FollowButton/g)?.length).toBe(1);
  });

  it("does not use a Nike-style brand subtitle under the image", () => {
    const img = card.indexOf("<img");
    const afterImage = card.slice(img);
    expect(afterImage).not.toMatch(/brand\.name/);
    expect(card).not.toMatch(/text-nike-grey/);
  });

  it("links the display name to the brand page", () => {
    expect(card).toMatch(/pathname: "\/brands\/\[slug\]"/);
    expect(card).toMatch(/params: \{ slug: brand\.slug \}/);
    expect(card).toMatch(/dir="ltr"/);
    expect(card).toMatch(/@\$\{brand\.slug\}/);
  });
});

describe("Explore product posts", () => {
  it("passes brands into the stacked feed so author names can SSR", () => {
    expect(explore).toMatch(/getBrands/);
    expect(explore).toMatch(/<ProductGrid products=\{result\.items\} brands=\{brands\} \/>/);
  });
});
