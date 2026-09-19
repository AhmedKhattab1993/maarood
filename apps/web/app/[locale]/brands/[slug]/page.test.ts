import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("brand page product posts", () => {
  it("passes the current brand into ProductListing so posts can name the author", () => {
    const src = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/<ProductListing/);
    expect(src).toMatch(/brands=\{/);
    expect(src).toMatch(/name: brand\.name/);
    expect(src).toMatch(/slug: brand\.slug/);
  });
});
