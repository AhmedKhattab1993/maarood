"use client";

import { useLocale } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { CurrencyCode } from "@/lib/api/types";

/** Client-side price formatter — Intl depends on the active locale. */
export function ProductPrice({
  amount,
  currency,
}: {
  amount: number;
  currency: CurrencyCode;
}) {
  const locale = useLocale();
  return <>{formatPrice(amount, currency, locale)}</>;
}
