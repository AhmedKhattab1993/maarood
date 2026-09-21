import { describe, expect, it } from "vitest";
import { facetChoices, shopperFacets } from "./facet-choices";

describe("facetChoices", () => {
  it("leaves the list alone when the selection is already present", () => {
    expect(facetChoices(["Black", "White"], "black")).toEqual(["Black", "White"]);
  });

  it("pins a selection that the facet list did not return", () => {
    expect(facetChoices(["Black"], "Navy")).toEqual(["Navy", "Black"]);
  });

  it("returns the catalog list when nothing is selected", () => {
    expect(facetChoices(["M", "L"])).toEqual(["M", "L"]);
  });
});

describe("shopperFacets", () => {
  it("drops sizes and sku codes out of the color list", () => {
    const shown = shopperFacets({
      colors: ["L", "M", "Black", "0020", "White", "38"],
      sizes: ["L", "M", "Default Title", "Black", "S/M", "4 Years"],
    });
    expect(shown.colors).toEqual(["Black", "White"]);
    expect(shown.sizes).toEqual(["L", "M", "S/M", "4 Years"]);
  });
});
