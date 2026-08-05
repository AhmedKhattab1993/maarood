import type { CurrencyCode } from "./api/types";

/**
 * Format a price for display. Currency is whatever the backend sent (EGP for
 * the MVP — see apps/scraper normalize.ts). We use Intl with the active locale
 * so Arabic pages show Arabic-Indic digits per locale convention.
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown currency code — fall back to "<amount> <code>".
    return `${amount} ${currency}`;
  }
}

/** Pluralized count helper for "12 products" / "١٢ منتج". */
export function formatCount(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(n);
}
