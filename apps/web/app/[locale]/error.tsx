"use client";

import { useTranslations } from "next-intl";

/** Route-level error boundary. Catches fetch/render errors for this segment. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("State");
  return (
    <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-center gap-3 px-4 py-24 text-center">
      <p className="text-base font-medium text-alert-red">{t("error")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-default border border-stone-grey bg-white px-4 py-2 text-sm text-ink-black hover:bg-stone-grey"
      >
        {t("retry")}
      </button>
    </div>
  );
}
