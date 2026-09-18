import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  productFeedItemClass,
  productFeedListClass,
} from "./product-feed-layout";

const MULTI_COL = /grid-cols-2|md:grid-cols-3|lg:grid-cols-4|xl:grid-cols-5/;

describe("productFeedListClass", () => {
  it("is a single-column stacked feed, not a multi-column product wall", () => {
    const cls = productFeedListClass();
    expect(cls).toMatch(/flex-col/);
    expect(cls).not.toMatch(MULTI_COL);
    expect(cls).not.toMatch(/\bgrid\b/);
  });

  it("is the same layout the skeleton uses", () => {
    expect(productFeedItemClass()).toMatch(/\bw-full\b/);
    expect(productFeedItemClass()).not.toMatch(MULTI_COL);
    const src = readFileSync(new URL("./product-grid.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/className=\{productFeedListClass\(\)\}/);
    expect(src.match(/productFeedListClass\(\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(src).not.toMatch(MULTI_COL);
  });
});
