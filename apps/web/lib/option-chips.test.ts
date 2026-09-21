import { describe, expect, it } from "vitest";
import { firstSelectableChip, optionChips } from "./option-chips";

const base = {
  sizes: [] as string[],
  colors: [] as string[],
  options: [] as { name: string; values: string[] }[],
  variants: [] as { size?: string; color?: string; availability: "in_stock" | "out_of_stock" | "unknown" }[],
};

describe("optionChips", () => {
  it("merges option groups, lists, and variants without duplicating case", () => {
    const chips = optionChips("size", {
      ...base,
      sizes: ["M"],
      options: [{ name: "Size", values: ["S", "M"] }],
      variants: [{ size: "s", availability: "in_stock" }],
    });
    expect(chips.map((chip) => chip.value)).toEqual(["S", "M"]);
    expect(chips.every((chip) => !chip.disabled)).toBe(true);
  });

  it("disables a size only when every matching variant is out of stock", () => {
    const chips = optionChips("size", {
      ...base,
      sizes: ["S", "M", "L"],
      variants: [
        { size: "S", availability: "out_of_stock" },
        { size: "M", availability: "out_of_stock" },
        { size: "M", availability: "in_stock" },
        { size: "L", availability: "unknown" },
      ],
    });
    expect(chips).toEqual([
      { value: "S", disabled: true },
      { value: "M", disabled: false },
      { value: "L", disabled: false },
    ]);
  });

  it("does not disable a color that has no variant stock row", () => {
    const chips = optionChips("color", {
      ...base,
      colors: ["Black"],
      options: [{ name: "اللون", values: ["White"] }],
    });
    expect(chips).toEqual([
      { value: "White", disabled: false },
      { value: "Black", disabled: false },
    ]);
  });
});

describe("firstSelectableChip", () => {
  it("skips disabled chips", () => {
    expect(
      firstSelectableChip([
        { value: "S", disabled: true },
        { value: "M", disabled: false },
      ]),
    ).toBe("M");
    expect(firstSelectableChip([{ value: "S", disabled: true }])).toBeNull();
  });
});
