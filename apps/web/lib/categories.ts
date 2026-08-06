/**
 * Canonical category values are stored lowercase (taxonomy.ts in @maarood/schema).
 * This maps them to friendly display names for the UI (Nike shows "Shoes",
 * "Clothing" rather than the stored slug). URLs keep the canonical value.
 */

import type { CategorySummary } from "./api/types";

/** Canonical → i18n key under the `Category` namespace. */
export const CATEGORY_LABELS: Record<string, string> = {
  apparel: "apparel",
  footwear: "footwear",
  accessories: "accessories",
  bags: "bags",
  jewelry: "jewelry",
  other: "other",
};

/**
 * The i18n key for a category's display name, falling back to the raw value
 * for any category not in the map.
 */
export function categoryLabelKey(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Friendly display name for a category, falling back to the raw value. */
export function categoryName(
  category: string,
  t: (key: string) => string,
): string {
  const key = categoryLabelKey(category);
  try {
    const label = t(key);
    // If the key is missing, next-intl throws/returns the key; fall back.
    return label === key ? fallbackName(category) : label;
  } catch {
    return fallbackName(category);
  }
}

/** Capitalize the canonical value as a last-resort display name. */
function fallbackName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Map a category list to { name (display), value (canonical), productCount }
 * for FacetNav / tiles. Uses the translation function for display names.
 */
export function categoryItems(
  categories: CategorySummary[],
  t: (key: string) => string,
): Array<{ label: string; value: string; count: number }> {
  return categories.map((c) => ({
    label: categoryName(c.name, t),
    value: c.name,
    count: c.productCount,
  }));
}
