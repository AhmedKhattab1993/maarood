"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveProduct, unsaveProduct } from "@/lib/saved";
import { ApiError } from "@/lib/api/types";

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
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        if (saved) {
          await unsaveProduct(productId);
          setSaved(false);
        } else {
          await saveProduct(productId);
          setSaved(true);
        }
      } catch (err) {
        // Surface the backend message if available; savedProducts is non-critical.
        const message =
          err instanceof ApiError ? err.message : t("error" as never);
        // Avoid blocking the UI; could be wired to a toast later.
        console.warn("save toggle failed", message);
      }
    });
  }

  if (variant === "label") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="rounded-default border border-stone-grey bg-white px-4 py-2 text-sm text-ink-black transition-colors hover:bg-stone-grey disabled:opacity-50"
      >
        {saved ? t("saved") : t("save")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? t("unsave") : t("save")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-stone-grey bg-white/90 text-ink-black backdrop-blur transition-colors hover:bg-stone-grey disabled:opacity-50"
    >
      <BookmarkIcon filled={saved} />
    </button>
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
