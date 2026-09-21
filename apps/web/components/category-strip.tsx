"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { categoryName } from "@/lib/categories";
import { useQueryParams } from "@/lib/use-query-params";
import type { CategorySummary } from "@/lib/api/types";

type Href = Parameters<typeof Link>[0]["href"];

/** One scrolling row of catalog categories, placed under the header tabs. */
export function CategoryStrip({
  categories,
  active,
  mode = "query",
}: {
  categories: CategorySummary[];
  active?: string;
  /** `query` sets ?category= on this page. `path` opens /c/[category]. */
  mode?: "query" | "path";
}) {
  if (categories.length === 0) return null;
  return (
    <Suspense fallback={null}>
      <CategoryStripInner categories={categories} active={active} mode={mode} />
    </Suspense>
  );
}

function CategoryStripInner({
  categories,
  active,
  mode,
}: {
  categories: CategorySummary[];
  active?: string;
  mode: "query" | "path";
}) {
  const t = useTranslations("Filters");
  const tCat = useTranslations("Category");
  const tHome = useTranslations("Home");
  const { searchParams, pushParams } = useQueryParams();

  function selectQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("category", value);
    else params.delete("category");
    pushParams(params, true);
  }

  function pathHref(value: string | null): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("page");
    const qs = params.toString();
    const path = value ? `/c/${encodeURIComponent(value)}` : "/";
    return qs ? `${path}?${qs}` : path;
  }

  return (
    <nav aria-label={tHome("shopByCategory")} className="mb-4 overflow-x-auto">
      <ul className="flex w-max flex-nowrap gap-2">
        <li>
          {mode === "path" ? (
            <ChipLink href={pathHref(null)} active={!active}>
              {t("all")}
            </ChipLink>
          ) : (
            <ChipButton active={!active} onClick={() => selectQuery("")}>
              {t("all")}
            </ChipButton>
          )}
        </li>
        {categories.map((category) => {
          const isActive = category.name === active;
          const label = categoryName(category.name, tCat);
          return (
            <li key={category.name}>
              {mode === "path" ? (
                <ChipLink href={pathHref(isActive ? null : category.name)} active={isActive}>
                  {label}
                </ChipLink>
              ) : (
                <ChipButton
                  active={isActive}
                  onClick={() => selectQuery(isActive ? "" : category.name)}
                >
                  {label}
                </ChipButton>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function chipClass(active: boolean): string {
  return active
    ? "inline-flex items-center whitespace-nowrap border border-ink-black bg-ink-black px-3 py-2 text-sm text-white"
    : "inline-flex items-center whitespace-nowrap border border-stone-grey bg-white px-3 py-2 text-sm text-ink-black hover:border-ink-black";
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={chipClass(active)}>
      {children}
    </button>
  );
}

function ChipLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as Href}
      aria-current={active ? "page" : undefined}
      className={chipClass(active)}
    >
      {children}
    </Link>
  );
}
