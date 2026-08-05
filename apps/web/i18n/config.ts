export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

/** Arabic-first — locked by 03_VISUAL_IDENTITY.md. */
export const defaultLocale: Locale = "ar";

export const localeLabels: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** HTML dir for each locale. */
export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** BCP-47 tag for <html lang>. */
export function htmlLang(locale: Locale): string {
  return locale === "ar" ? "ar-EG" : "en-US";
}
