import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

describe("web listen host", () => {
  it("dev and start bind 0.0.0.0 so the site is reachable on the public IPv4", () => {
    const pkg = JSON.parse(
      readFileSync(new URL("./package.json", import.meta.url), "utf8"),
    ) as { scripts: { dev: string; start: string } };
    expect(pkg.scripts.dev).toMatch(/-H 0\.0\.0\.0/);
    expect(pkg.scripts.start).toMatch(/-H 0\.0\.0\.0/);
  });
});
