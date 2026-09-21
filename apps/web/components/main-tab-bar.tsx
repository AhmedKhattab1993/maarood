"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_TABS, mainTabIdForPath } from "./main-tabs";

/** Three primary destinations. Visual order: Following | Explore | Favourites. */
export function MainTabBar({ variant }: { variant: "header" | "mobile" }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const active = mainTabIdForPath(pathname);

  const labels: Record<(typeof MAIN_TABS)[number]["id"], string> = {
    following: t("following"),
    explore: t("explore"),
    favourites: t("favourites"),
  };

  if (variant === "header") {
    return (
      <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium md:flex" dir="ltr">
        {MAIN_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={{ pathname: tab.pathname }}
            aria-current={active === tab.id ? "page" : undefined}
            className={
              active === tab.id
                ? "font-semibold text-ink-black underline decoration-2 underline-offset-8"
                : "text-nike-grey transition-colors hover:text-ink-black"
            }
          >
            {labels[tab.id]}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label={t("explore")}
      dir="ltr"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-grey bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-[var(--container-max)] items-stretch justify-around">
        {MAIN_TABS.map((tab) => (
          <li key={tab.id} className="flex-1">
            <Link
              href={{ pathname: tab.pathname }}
              aria-current={active === tab.id ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs ${
                active === tab.id
                  ? "font-semibold text-ink-black"
                  : "text-nike-grey"
              }`}
            >
              {labels[tab.id]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
