"use client";

import { useState } from "react";
import {
  firstSelectableChip,
  isColorOptionName,
  isSizeOptionName,
  optionChips,
  type OptionChip,
} from "@/lib/option-chips";
import type { ProductOption, Variant } from "@/lib/api/types";

/** Size and color as chips. Out-of-stock values are disabled. */
export function ProductOptions({
  sizes,
  colors,
  options,
  variants,
  sizeLabel,
  colorLabel,
}: {
  sizes: string[];
  colors: string[];
  options: ProductOption[];
  variants: Variant[];
  sizeLabel: string;
  colorLabel: string;
}) {
  const product = { sizes, colors, options, variants };
  const sizeChipList = optionChips("size", product);
  const colorChipList = optionChips("color", product);
  const other = options.filter(
    (option) => !isSizeOptionName(option.name) && !isColorOptionName(option.name),
  );

  return (
    <div className="flex flex-col gap-4">
      <ChipGroup label={sizeLabel} chips={sizeChipList} />
      <ChipGroup label={colorLabel} chips={colorChipList} />
      {other.map((option) => (
        <p key={option.name} className="text-sm text-ink-black">
          <span className="text-nike-grey">{option.name}</span>{" "}
          {option.values.join(" · ")}
        </p>
      ))}
    </div>
  );
}

function ChipGroup({ label, chips }: { label: string; chips: OptionChip[] }) {
  const [selected, setSelected] = useState<string | null>(firstSelectableChip(chips));
  if (chips.length === 0) return null;
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2 text-sm font-medium text-ink-black">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = !chip.disabled && chip.value === selected;
          return (
            <button
              key={chip.value}
              type="button"
              disabled={chip.disabled}
              aria-pressed={active}
              onClick={() => setSelected(chip.value)}
              className={
                chip.disabled
                  ? "border border-stone-grey px-3 py-1.5 text-sm text-nike-grey line-through disabled:cursor-not-allowed"
                  : active
                    ? "border border-ink-black bg-ink-black px-3 py-1.5 text-sm text-white"
                    : "border border-stone-grey px-3 py-1.5 text-sm text-ink-black hover:border-ink-black"
              }
            >
              {chip.value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
