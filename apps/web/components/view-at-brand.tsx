"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { publicRedirectHref } from "@/lib/api/backend-url";
import { shoppingDestination } from "@/lib/shopping-destination";

export function ViewAtBrand({
  productId,
  redirectUrl,
  brandName,
  variant = "card",
}: {
  productId: string;
  redirectUrl: string | null;
  brandName: string;
  variant?: "card" | "detail";
}) {
  const t = useTranslations("Product");
  const [unavailable, setUnavailable] = useState(false);
  const dest = shoppingDestination(redirectUrl);
  const label = brandName
    ? t("viewAtBrand", { brand: brandName })
    : t("buyFromBrand");
  const ariaLabel = `${label}. ${t("leavesMaaroud")}`;
  const cls =
    variant === "detail"
      ? "inline-flex items-center justify-center gap-1 rounded-default bg-maaroud-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-maaroud-blue-dark"
      : "inline-flex flex-1 items-center justify-center gap-1 rounded-default bg-maaroud-blue px-3 py-2 text-sm font-semibold text-white hover:bg-maaroud-blue-dark";

  function onUnavailable(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setUnavailable(true);
  }

  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      {dest.ok ? (
        <a
          href={publicRedirectHref(productId)}
          rel="noopener noreferrer nofollow"
          aria-label={ariaLabel}
          onClick={(e) => e.stopPropagation()}
          className={cls}
        >
          {label} <span aria-hidden>↗</span>
        </a>
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={onUnavailable}
          className={cls}
        >
          {label} <span aria-hidden>↗</span>
        </button>
      )}
      {unavailable && (
        <span role="alert" className="text-xs text-alert-red">
          {t("linkUnavailable")}
        </span>
      )}
    </span>
  );
}
