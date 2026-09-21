import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const card = readFileSync(new URL("./product-card.tsx", import.meta.url), "utf8");
const avatar = readFileSync(new URL("./brand-avatar.tsx", import.meta.url), "utf8");
const explore = readFileSync(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8");
const feed = readFileSync(new URL("./discovery-feed.tsx", import.meta.url), "utf8");
const listing = readFileSync(new URL("./product-listing.tsx", import.meta.url), "utf8");
const tabs = readFileSync(new URL("./main-tabs.ts", import.meta.url), "utf8");

function sliceFn(src: string, name: string): string {
  const start = src.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`missing ${name}`);
  const next = src.indexOf("\nfunction ", start + 1);
  return src.slice(start, next === -1 ? src.length : next);
}

const gridCard = sliceFn(card, "GridCard");
const feedPost = sliceFn(card, "FeedPost");

describe("catalog grid card", () => {
  it("shows the brand, title, and price, and saves on the photo", () => {
    expect(gridCard).toMatch(/brand\.name/);
    expect(gridCard).toMatch(/product\.title/);
    expect(gridCard).toMatch(/<Price/);
    expect(gridCard).toMatch(/absolute end-2 top-2/);
    expect(gridCard).toMatch(/<SaveButton/);
    expect(gridCard).toMatch(/pathname: "\/p\/\[id\]"/);
  });

  it("does not follow or leave Maaroud from the tile", () => {
    expect(gridCard).not.toMatch(/FollowButton/);
    expect(gridCard).not.toMatch(/ViewAtBrand/);
    expect(card).not.toMatch(/ViewAtBrand/);
  });
});

describe("Following feed post", () => {
  it("places brand identity and Follow in a header before the cover", () => {
    const headerStart = feedPost.indexOf("<header");
    const headerEnd = feedPost.indexOf("</header>");
    const header = feedPost.slice(headerStart, headerEnd);
    expect(header).toMatch(/\{brand\.name\}/);
    expect(header).toMatch(/<FollowButton/);
    expect(header).toMatch(/<BrandAvatar/);
    expect(header).toMatch(/@\$\{brand\.slug\}/);
    expect(header).toMatch(/dir="ltr"/);
    expect(feedPost.indexOf("<Cover")).toBeGreaterThan(headerEnd);
    expect(avatar).toMatch(/src=\{logoUrl\}/);
    expect(avatar).toMatch(/charAt\(0\)/);
  });

  it("keeps save on the photo and the product link internal", () => {
    expect(feedPost).toMatch(/absolute end-2 top-2/);
    expect(feedPost).toMatch(/pathname: "\/p\/\[id\]"/);
    expect(feedPost).not.toMatch(/ViewAtBrand/);
  });
});

describe("card imagery", () => {
  it("crops the cover instead of letterboxing it", () => {
    expect(card).toMatch(/coverSrc\(product\.imageUrls\)/);
    expect(card).toMatch(/object-cover/);
    expect(card).not.toMatch(/object-contain/);
    expect(card).toMatch(/line-clamp-2/);
  });
});

describe("Explore product posts", () => {
  it("passes brands into the catalog grid", () => {
    expect(explore).toMatch(/getBrands/);
    expect(explore).toMatch(/ProductListing/);
    expect(listing).toMatch(/layout = "grid"/);
    expect(listing).toMatch(/DiscoveryFeed/);
    expect(feed).toMatch(/ProductGrid/);
    expect(feed).toMatch(/layout = "grid"/);
  });

  it("keeps filters, sort, and load-more", () => {
    expect(explore).toMatch(/getCategories/);
    expect(explore).toMatch(/getFacets/);
    expect(listing).toMatch(/FilterBar/);
    expect(listing).toMatch(/CategoryStrip/);
    expect(listing).toMatch(/SortSelect/);
    expect(explore).not.toMatch(/Pagination/);
    expect(feed).toMatch(/loadMore/);
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
