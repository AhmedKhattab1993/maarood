/** Keep a selected color or size visible even if it is outside the top facet list. */
export function facetChoices(values: string[], selected?: string): string[] {
  if (!selected) return values;
  const key = selected.trim().toLocaleLowerCase();
  if (!key) return values;
  if (values.some((value) => value.toLocaleLowerCase() === key)) return values;
  return [selected.trim(), ...values];
}

const SIZE_WORD =
  "xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl|5xl|2x|3x|4x|small|medium|large|x-large|xlarge|xx-large|one size|onesize|os";

/**
 * Merchants sometimes store sizes, SKUs, and colors in the same JSON lists.
 * The filter should offer a shopper a size or a color, not "0020" or "L"
 * under the wrong heading.
 */
export function isSizeLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return false;
  if (new RegExp(`^(?:${SIZE_WORD})$`, "i").test(normalized)) return true;
  if (
    new RegExp(`^(?:${SIZE_WORD})(?:\\s*[/\\-]\\s*(?:${SIZE_WORD}))+$`, "i").test(
      normalized,
    )
  ) {
    return true;
  }
  if (/^\d{1,2}(?:\.\d)?$/.test(normalized)) return true;
  if (/^\d+\s*(?:years|year|yrs|y)$/i.test(normalized)) return true;
  return false;
}

export function isSkuLabel(value: string): boolean {
  return /^\d{3,}$/.test(value.trim());
}

export function shopperFacets(facets: {
  colors: string[];
  sizes: string[];
}): { colors: string[]; sizes: string[] } {
  const sizes = facets.sizes.filter(
    (value) => isSizeLabel(value) && !isSkuLabel(value),
  );
  return {
    colors: facets.colors.filter(
      (value) => !isSizeLabel(value) && !isSkuLabel(value),
    ),
    sizes:
      sizes.length > 0
        ? sizes
        : facets.sizes.filter(
            (value) =>
              !isSkuLabel(value) && value.trim().toLowerCase() !== "default title",
          ),
  };
}
