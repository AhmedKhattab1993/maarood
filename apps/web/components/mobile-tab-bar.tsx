"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Bottom tab bar — mobile only (Shop by Shopify reference for mobile nav).
 * Three primary destinations: Home, Search, Saved. Hidden on md+ where the
 * desktop top nav + search bar take over.
 */
export function MobileTabBar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("home")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-grey bg-warm-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-[var(--container-max)] items-stretch justify-around">
        <Tab
          href={{ pathname: "/" }}
          active={pathname === "/"}
          label={t("home")}
          icon={<HomeIcon />}
        />
        <Tab
          href={{ pathname: "/search" }}
          active={pathname.startsWith("/search")}
          label={t("search")}
          icon={<SearchIcon />}
        />
        <Tab
          href={{ pathname: "/saved" }}
          active={pathname.startsWith("/saved")}
          label={t("saved")}
          icon={<BookmarkIcon />}
        />
      </ul>
    </nav>
  );
}

function Tab({
  href,
  active,
  label,
  icon,
}: {
  href: Parameters<typeof Link>[0]["href"];
  active: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] transition-colors ${
          active ? "text-maaroud-blue" : "text-cool-grey"
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 11.5 12 4l9 7.5" strokeLinejoin="round" />
      <path d="M5 10v9h14v-9" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 4h12v16l-6-4-6 4V4z" strokeLinejoin="round" />
    </svg>
  );
}
