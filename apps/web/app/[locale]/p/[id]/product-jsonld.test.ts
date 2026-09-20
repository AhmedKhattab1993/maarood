import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ProductJsonLd", () => {
  const src = readFileSync(new URL("./product-jsonld.tsx", import.meta.url), "utf8");

  it("does not map unknown availability to schema.org InStock", () => {
    expect(src).toMatch(/in_stock/);
    expect(src).toMatch(/OutOfStock/);
    expect(src).not.toMatch(/: "https:\/\/schema\.org\/InStock"/);
    expect(src).toMatch(/availability === "in_stock"/);
  });
});
