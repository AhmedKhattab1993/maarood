"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale } from "@/i18n/config";

/** Toggle between Arabic and English, preserving the current path. */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");

  const next: Locale = locale === "ar" ? "en" : "ar";

  function switchTo() {
    // pathname is always a valid declared route at runtime; cast satisfies the
    // typed router which can't infer this from the usePathname() union.
    router.replace(pathname as never, { locale: next });
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      className="rounded-md px-3 py-1.5 text-sm text-ink-black transition-colors hover:bg-stone-grey"
      aria-label={t("language")}
    >
      {t("language")}
    </button>
  );
}
