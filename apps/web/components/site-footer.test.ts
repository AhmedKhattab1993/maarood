import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("footer help", () => {
  const footer = readFileSync(new URL("./site-footer.tsx", import.meta.url), "utf8");
  const helpPage = new URL("../app/[locale]/help/page.tsx", import.meta.url);

  it("does not link Shipping/Returns as Maaroud policies", () => {
    expect(footer).not.toMatch(/t\("shipping"\)/);
    expect(footer).not.toMatch(/t\("returns"\)/);
    expect(footer).toMatch(/orderHelp/);
    expect(footer).toMatch(/maaroudHelp/);
    expect(footer).toMatch(/pathname: "\/help"/);
    expect(existsSync(helpPage)).toBe(true);
    const help = readFileSync(helpPage, "utf8");
    expect(help).toMatch(/Help/);
    expect(help).toMatch(/brandOrders/);
  });

  it("has no dead '#' placeholder links", () => {
    expect(footer).not.toMatch(/href="#"/);
  });
});
