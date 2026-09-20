"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveProduct, unsaveProduct } from "@/lib/saved";
import { ApiError } from "@/lib/api/types";
import { getAuthToken } from "@/lib/auth";
import { saveIntent, toggleVisual } from "@/lib/follow-intent";
import { currentReturnTo, stash } from "@/lib/pending-action";
import { useRouter } from "@/i18n/navigation";

/** Heart/bookmark toggle that calls the anonymous saved-products API. */
export function SaveButton({
  productId,
  initialSaved = false,
  variant = "icon",
}: {
  productId: string;
  initialSaved?: boolean;
  variant?: "icon" | "label";
}) {
  const t = useTranslations("Product");
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const visual = toggleVisual(saved, pending, failed);

  function toggle(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const intent = saveIntent(Boolean(getAuthToken()), saved);
    if (intent === "login") {
      stash({ type: "save", productId, returnTo: currentReturnTo() });
      router.push("/login");
      return;
    }
    setFailed(false);
    startTransition(async () => {
      try {
        if (intent === "unsave") {
          await unsaveProduct(productId);
          setSaved(false);
        } else {
          await saveProduct(productId);
          setSaved(true);
        }
      } catch (err) {
        setFailed(true);
        const message = err instanceof ApiError ? err.message : t("error");
        console.warn("save toggle failed", message);
      }
    });
  }

  const ariaLabel =
    visual === "pending"
      ? t("savePending")
      : visual === "failed"
        ? t("saveFailed")
        : saved
          ? t("unsave")
          : t("save");

  if (variant === "label") {
    const labelClass =
      visual === "active"
        ? "border-ink-black bg-ink-black text-white"
        : visual === "failed"
          ? "border-alert-red bg-white text-alert-red"
          : "border-stone-grey bg-white text-ink-black hover:bg-stone-grey";
    return (
      <span className="inline-flex flex-col gap-1">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={saved}
          aria-busy={pending || undefined}
          aria-label={ariaLabel}
          className={`rounded-default border px-4 py-2 text-sm transition-colors disabled:opacity-50 ${labelClass}`}
        >
          {visual === "pending"
            ? t("savePending")
            : saved
              ? t("saved")
              : t("save")}
        </button>
        {visual === "failed" && (
          <span role="alert" aria-live="polite" className="text-xs text-alert-red">
            {t("saveFailed")}
          </span>
        )}
      </span>
    );
  }

  const iconClass =
    visual === "active"
      ? "border-ink-black bg-ink-black text-white"
      : visual === "failed"
        ? "border-alert-red bg-white text-alert-red"
        : "border-stone-grey bg-white/90 text-ink-black hover:bg-stone-grey";

  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        aria-busy={pending || undefined}
        aria-label={ariaLabel}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-pill border backdrop-blur transition-colors disabled:opacity-50 ${iconClass}`}
      >
        <BookmarkIcon filled={saved && visual !== "failed"} />
      </button>
      {visual === "failed" && (
        <span role="alert" aria-live="polite" className="sr-only">
          {t("saveFailed")}
        </span>
      )}
    </span>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M6 4h12v17l-6-4-6 4V4z" strokeLinejoin="round" />
    </svg>
  );
}
