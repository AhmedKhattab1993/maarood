import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const card = readFileSync(new URL("./product-card.tsx", import.meta.url), "utf8");
const viewAt = readFileSync(new URL("./view-at-brand.tsx", import.meta.url), "utf8");
const explore = readFileSync(
  new URL("../app/[locale]/page.tsx", import.meta.url),
  "utf8",
);
const feed = readFileSync(new URL("./discovery-feed.tsx", import.meta.url), "utf8");
const controls = readFileSync(
  new URL("./explore-controls.tsx", import.meta.url),
  "utf8",
);
const tabs = readFileSync(new URL("./main-tabs.ts", import.meta.url), "utf8");

describe("product post author row", () => {
  it("places brand identity and Follow in a header before the cover image", () => {
    const header = card.indexOf("<header");
    const name = card.indexOf("{brand.name}");
    const follow = card.indexOf("<FollowButton");
    const headerEnd = card.indexOf("</header>");
    const coverImg = card.slice(headerEnd).indexOf("<img");
    expect(header).toBeGreaterThan(-1);
    expect(name).toBeGreaterThan(header);
    expect(follow).toBeGreaterThan(header);
    expect(follow).toBeLessThan(headerEnd);
    expect(name).toBeLessThan(headerEnd);
    expect(coverImg).toBeGreaterThan(-1);
    expect(card.match(/<FollowButton/g)?.length).toBe(1);
  });

  it("renders the brand logo <img> in the author row when a URL is present", () => {
    const header = card.slice(card.indexOf("<header"), card.indexOf("</header>"));
    expect(header).toMatch(/brand\.logoUrl/);
    expect(header).toMatch(/src=\{brand\.logoUrl\}/);
    expect(header).toMatch(/<img/);
    expect(card).not.toMatch(/from ["']next\/image["']/);
  });

  it("keeps the initial-letter avatar when the logo is absent", () => {
    const header = card.slice(card.indexOf("<header"), card.indexOf("</header>"));
    expect(header).toMatch(/charAt\(0\)/);
    expect(header).toMatch(/logoFailed/);
  });

  it("does not use a Nike-style brand subtitle under the image", () => {
    const afterHeader = card.slice(card.indexOf("</header>"));
    expect(afterHeader).not.toMatch(/brand\.name/);
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
    expect(explore).toMatch(/DiscoveryFeed/);
    expect(feed).toMatch(/ProductGrid/);
  });

  it("exposes Category and Budget controls and load-more instead of numbered pages", () => {
    expect(explore).toMatch(/ExploreControls/);
    expect(controls).toMatch(/t\("category"\)/);
    expect(controls).toMatch(/t\("budget"\)/);
    expect(explore).toMatch(/getCategories/);
    expect(explore).not.toMatch(/Pagination/);
    expect(feed).toMatch(/loadMore/);
    expect(feed).not.toMatch(/pageCount/);
  });
});

describe("MAIN_TABS", () => {
  it("stays Following | Explore | Favourites", () => {
    expect(tabs).toMatch(/following/);
    expect(tabs).toMatch(/explore/);
    expect(tabs).toMatch(/favourites/);
    expect(tabs).toMatch(/pathname: "\/following"/);
    expect(tabs).toMatch(/pathname: "\/"/);
    expect(tabs).toMatch(/pathname: "\/favourites"/);
  });
});

describe("shopping CTA and media", () => {
  it("keeps image+title as an internal product link and View at brand outside it", () => {
    expect(card + viewAt).toMatch(/viewAtBrand/);
    expect(card).toMatch(/ViewAtBrand/);
    expect(card).toMatch(/pathname: "\/p\/\[id\]"/);
    expect(card).toMatch(/object-contain/);
    expect(card).toMatch(/line-clamp-2/);
    expect(card).not.toMatch(/line-clamp-1/);
    expect(card).not.toMatch(/object-cover/);

    const headerEnd = card.indexOf("</header>");
    const afterHeader = card.slice(headerEnd);
    const productLinkClose = afterHeader.indexOf("</Link>");
    const insideProductLink = afterHeader.slice(0, productLinkClose);
    const afterProductLink = afterHeader.slice(productLinkClose);
    expect(insideProductLink).toMatch(/pathname: "\/p\/\[id\]"/);
    expect(insideProductLink).not.toMatch(/FollowButton/);
    expect(insideProductLink).not.toMatch(/SaveButton/);
    expect(insideProductLink).not.toMatch(/ViewAtBrand/);
    expect(afterProductLink).toMatch(/SaveButton/);
    expect(afterProductLink).toMatch(/ViewAtBrand/);
  });
});
