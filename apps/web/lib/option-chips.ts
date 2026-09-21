import type { ProductOption, Variant } from "./api/types";

export interface OptionChip {
  value: string;
  /** True when every variant of this value is out of stock. */
  disabled: boolean;
}

const SIZE_NAMES = new Set(["size", "sizes", "المقاس"]);
const COLOR_NAMES = new Set(["color", "colour", "colors", "اللون"]);

export function isSizeOptionName(name: string): boolean {
  return SIZE_NAMES.has(name.trim().toLowerCase());
}

export function isColorOptionName(name: string): boolean {
  return COLOR_NAMES.has(name.trim().toLowerCase());
}

/**
 * Size or color chips for the product page. A value is disabled only when
 * the catalog has variants for it and all of them are out of stock. Missing
 * variant rows stay selectable — we do not invent an out-of-stock state.
 */
export function optionChips(
  kind: "size" | "color",
  product: {
    sizes: string[];
    colors: string[];
    options: ProductOption[];
    variants: Pick<Variant, "size" | "color" | "availability">[];
  },
): OptionChip[] {
  const isName = kind === "size" ? isSizeOptionName : isColorOptionName;
  const fromOptions = product.options
    .filter((option) => isName(option.name))
    .flatMap((option) => option.values);
  const fromLists = kind === "size" ? product.sizes : product.colors;
  const fromVariants = product.variants.map((variant) =>
    kind === "size" ? variant.size : variant.color,
  );
  const values = uniqueDisplay([
    ...fromOptions,
    ...fromLists,
    ...fromVariants.filter((value): value is string => Boolean(value)),
  ]);

  return values.map((value) => ({
    value,
    disabled: everyMatchOutOfStock(product.variants, kind, value),
  }));
}

function uniqueDisplay(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function everyMatchOutOfStock(
  variants: Pick<Variant, "size" | "color" | "availability">[],
  kind: "size" | "color",
  value: string,
): boolean {
  const matches = variants.filter((variant) => {
    const raw = kind === "size" ? variant.size : variant.color;
    return raw?.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase();
  });
  if (matches.length === 0) return false;
  return matches.every((variant) => variant.availability === "out_of_stock");
}

export function firstSelectableChip(chips: OptionChip[]): string | null {
  return chips.find((chip) => !chip.disabled)?.value ?? null;
}
