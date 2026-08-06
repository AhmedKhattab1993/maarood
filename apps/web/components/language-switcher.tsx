"use client";

import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Locale } from "@/i18n/config";

/**
 * Toggle between Arabic and English, preserving the current path + query.
 *
 * Uses Next.js's router/pathname (not next-intl's) because next-intl's
 * `usePathname` returns the route template (`/c/[category]`) which can't be
 * pushed back, and its router re-applies the current locale prefix on replace.
 * We read the concrete path, swap the locale segment, and navigate plainly.
 *
 * `useSearchParams` forces this component into a Suspense boundary during
 * static prerendering, so the inner hook consumer is split out.
 */
export function LanguageSwitcher() {
  return (
    <Suspense fallback={<LanguageSwitcherShell onClick={() => {}} label="" />}>
      <LanguageSwitcherInner />
    </Suspense>
  );
}

function LanguageSwitcherInner() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Nav");

  const next: Locale = locale === "ar" ? "en" : "ar";

  function switchTo() {
    // pathname is concrete, e.g. "/ar/c/apparel". Swap the locale segment.
    const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");
    const rest = stripped === "" ? "/" : stripped;
    const target = `/${next}${rest === "/" ? "" : rest}`;
    const qs = searchParams.toString();
    router.replace(qs ? `${target}?${qs}` : target);
  }

  return <LanguageSwitcherShell onClick={switchTo} label={t("language")} />;
}

function LanguageSwitcherShell({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-1.5 text-sm text-ink-black transition-colors hover:bg-stone-grey"
      aria-label={label}
    >
      {label}
    </button>
  );
}
