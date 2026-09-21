import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const header = read("./site-header.tsx");
const searchPage = read("../app/[locale]/search/page.tsx");
const following = read("../app/[locale]/following/following-feed.tsx");
const saved = read("../app/[locale]/saved/saved-list.tsx");
const filters = read("./filter-bar.tsx");
const strip = read("./category-strip.tsx");
const gallery = read("./product-gallery.tsx");
const options = read("./product-options.tsx");
const buy = read("./view-at-brand.tsx");
const productPage = read("../app/[locale]/p/[id]/page.tsx");
const tabs = read("./main-tab-bar.tsx");
const css = read("../app/globals.css");

describe("search in the header", () => {
  it("puts search in the header, with its own row on a phone", () => {
    expect(header).toMatch(/<SearchBar/);
    expect(header).toMatch(/md:hidden/);
    expect(header.match(/<SearchBar/g)?.length).toBe(2);
  });

  it("does not render a second search field on the search page", () => {
    expect(searchPage).not.toMatch(/SearchBar/);
    expect(searchPage).toMatch(/startHint/);
  });
});

describe("feed versus catalog", () => {
  it("keeps Following as a feed and favourites as a grid", () => {
    expect(following).toMatch(/layout="feed"/);
    expect(saved).toMatch(/layout="grid"/);
    expect(following.match(/layout="feed"/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("category row and catalog filters", () => {
  it("scrolls categories in one row", () => {
    expect(strip).toMatch(/overflow-x-auto/);
    expect(strip).toMatch(/flex-nowrap/);
    expect(strip).toMatch(/\/c\/\$\{encodeURIComponent\(value\)\}/);
  });

  it("commits price on blur and offers color and size as choices", () => {
    expect(filters).toMatch(/nextPriceParams/);
    expect(filters).toMatch(/onBlur=\{onPriceBlur\}/);
    expect(filters).toMatch(/shopperFacets/);
    expect(filters).toMatch(/function ChoiceList/);
    expect(filters).not.toMatch(/type="text"/);
    expect(filters).not.toMatch(/t\("category"\)/);
    const priceField = filters.slice(filters.indexOf("function NumberField"));
    expect(priceField).toMatch(/onBlur/);
    expect(priceField).not.toMatch(/update\(/);
  });
});

describe("product page actions", () => {
  it("swipes and thumbnail-taps the gallery without cropping the photo", () => {
    expect(gallery).toMatch(/indexAfterSwipe/);
    expect(gallery).toMatch(/onTouchEnd/);
    expect(gallery).toMatch(/setIndex\(imageIndex\)/);
    expect(gallery).toMatch(/object-contain/);
  });

  it("renders size and color chips and disables out-of-stock values", () => {
    expect(options).toMatch(/optionChips\("size"/);
    expect(options).toMatch(/optionChips\("color"/);
    expect(options).toMatch(/disabled=\{chip\.disabled\}/);
    expect(productPage).toMatch(/<ProductOptions/);
    expect(productPage).not.toMatch(/<table/);
  });

  it("pins the blue buy button and does not also call availability unconfirmed when a size is in stock", () => {
    expect(buy).toMatch(/bg-maaroud-blue/);
    expect(buy).not.toMatch(/bg-ink-black/);
    expect(productPage).toMatch(/bottom-\[calc\(4rem\+env\(safe-area-inset-bottom\)\)\]/);
    expect(productPage).toMatch(/displayAvailability\(product\)/);
    expect(productPage).toMatch(/availability === "in_stock"/);
    expect(productPage).toMatch(/availability === "unknown"/);
    expect(productPage).not.toMatch(/product\.availability === "unknown"/);
  });
});

describe("chrome", () => {
  it("gives the bottom tabs icons and darkens meta text", () => {
    const mobile = tabs.slice(tabs.indexOf('variant === "header"'));
    expect(mobile).toMatch(/<TabIcon/);
    expect(tabs).toMatch(/<svg/);
    expect(css).toMatch(/--color-nike-grey:\s*#3f4248/);
  });
});
