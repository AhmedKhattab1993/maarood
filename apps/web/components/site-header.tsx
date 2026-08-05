import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { SearchBar } from "./search-bar";

/**
 * Desktop top navigation (server component). Mobile uses the bottom tab bar
 * (mobile-tab-bar.tsx); the header shows the logo + search on all breakpoints.
 * Async so it can await the Logo server component and getTranslations.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  return (
    <header className="sticky top-0 z-40 border-b border-stone-grey bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[var(--container-max)] items-center gap-4 px-4 md:gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <NavLink href={{ pathname: "/" }}>{t("home")}</NavLink>
          <NavLink href={{ pathname: "/brands" }}>{t("brands")}</NavLink>
          <NavLink href={{ pathname: "/saved" }}>{t("saved")}</NavLink>
        </nav>
        <div className="flex-1">
          <SearchBar />
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: Parameters<typeof Link>[0]["href"];
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-ink-black transition-colors hover:bg-stone-grey"
    >
      {children}
    </Link>
  );
}
