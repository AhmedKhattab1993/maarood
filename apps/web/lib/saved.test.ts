import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { saveIntent, toggleVisual } from "./follow-intent";
import { isProductSaved, savedProductIds } from "./saved";
import type { SavedProduct } from "./api/types";

function savedItem(id: string): SavedProduct {
  return {
    savedAt: "2026-01-01",
    product: { id } as SavedProduct["product"],
  };
}

describe("isProductSaved", () => {
  it("a Favourites item starts saved so the signed-in click unsaves", () => {
    const saved = isProductSaved("prod-1", { initialSaved: true });
    expect(saved).toBe(true);
    expect(toggleVisual(saved, false, false)).toBe("active");
    expect(saveIntent(true, saved)).toBe("unsave");
  });

  it("hydrated listSaved ids mark the matching product saved so the click unsaves", () => {
    const ids = savedProductIds([savedItem("prod-1"), savedItem("prod-2")]);
    const saved = isProductSaved("prod-1", { savedIds: ids });
    expect(ids).toEqual(["prod-1", "prod-2"]);
    expect(saved).toBe(true);
    expect(toggleVisual(saved, false, false)).toBe("active");
    expect(saveIntent(true, saved)).toBe("unsave");
  });

  it("a product not in saved ids is inactive so the click saves", () => {
    const saved = isProductSaved("prod-1", { savedIds: ["prod-9"] });
    expect(saved).toBe(false);
    expect(toggleVisual(saved, false, false)).toBe("inactive");
    expect(saveIntent(true, saved)).toBe("save");
  });
});

describe("SaveButton hydration", () => {
  const src = readFileSync(
    new URL("../components/save-button.tsx", import.meta.url),
    "utf8",
  );

  it("hydrates from listSaved and uses isProductSaved before the first click", () => {
    expect(src).toMatch(/listSaved\(/);
    expect(src).toMatch(/isProductSaved\(/);
    expect(src).toMatch(/savedProductIds\(/);
    expect(src).toMatch(/saveIntent\(Boolean\(getAuthToken\(\)\), saved\)/);
    expect(src).toMatch(/intent === ["']unsave["']/);
    expect(src).toMatch(/unsaveProduct\(productId\)/);
  });
});

describe("Favourites and cards pass saved through", () => {
  const grid = readFileSync(
    new URL("../components/product-grid.tsx", import.meta.url),
    "utf8",
  );
  const card = readFileSync(
    new URL("../components/product-card.tsx", import.meta.url),
    "utf8",
  );
  const list = readFileSync(
    new URL("../app/[locale]/saved/saved-list.tsx", import.meta.url),
    "utf8",
  );

  it("SavedList marks every Favourites row saved and ProductGrid forwards it", () => {
    expect(list).toMatch(/allSaved/);
    expect(grid).toMatch(/allSaved/);
    expect(grid).toMatch(/initialSaved=\{/);
    expect(card).toMatch(/initialSaved/);
    expect(card).toMatch(/<SaveButton[\s\S]*initialSaved=\{initialSaved\}/);
  });

  it("unsaving on Favourites removes the row from the list without a reload", () => {
    expect(card.replace(/\n/g, " ")).toMatch(
      /onSavedChange=\{\(id, saved\) => \{[\s\S]*?if \(!saved\) onUnsaved\?\.\(id\);/,
    );
    expect(grid).toMatch(/onUnsaved\?/);
    expect(grid).toMatch(/onUnsaved=\{onUnsaved\}/);
    expect(list).toMatch(/onUnsaved=\{\(productId\) =>/);
    expect(list).toMatch(/items: current\.items\.filter\(\(item\) => item\.product\.id !== productId\)/);
  });
});
