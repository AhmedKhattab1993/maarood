import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("BrandStrip", () => {
  it("links each brand to /brands/[slug] and the directory to /brands", () => {
    const src = readFileSync(new URL("./brand-strip.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/pathname: "\/brands\/\[slug\]"/);
    expect(src).toMatch(/params: \{ slug: b\.slug \}/);
    expect(src).toMatch(/pathname: "\/brands"/);
    expect(src).toMatch(/b\.name/);
  });
});
