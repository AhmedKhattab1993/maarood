import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SavedList brand identity", () => {
  it("loads GET /v1/brands and passes them to ProductGrid", () => {
    const src = readFileSync(new URL("./saved-list.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/\/v1\/brands/);
    expect(src).toMatch(/brands=\{state\.brands\}/);
    expect(src).toMatch(/loadBrands/);
    expect(src).toMatch(/allSaved/);
  });
});
