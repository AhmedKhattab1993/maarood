import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  productFeedListClass,
  productGridListClass,
  productListClass,
} from "./product-feed-layout";

describe("product layouts", () => {
  it("keeps Following as a single column", () => {
    const cls = productFeedListClass();
    expect(cls).toMatch(/flex-col/);
    expect(cls).toMatch(/max-w-xl/);
    expect(cls).not.toMatch(/grid-cols-/);
    expect(productListClass("feed")).toBe(cls);
  });

  it("lays the catalog out as two columns, four on a large screen", () => {
    const cls = productGridListClass();
    expect(cls).toMatch(/grid-cols-2/);
    expect(cls).toMatch(/lg:grid-cols-4/);
    expect(productListClass("grid")).toBe(cls);
  });

  it("uses the same layout class for the list and the skeleton", () => {
    const src = readFileSync(new URL("./product-grid.tsx", import.meta.url), "utf8");
    expect(src.match(/productListClass\(layout\)/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
