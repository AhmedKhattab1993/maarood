import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { SearchBar } from "./search-bar";
import { MainTabBar } from "./main-tab-bar";
import { AuthLink } from "./auth-link";

/** Top bar: logo, Following | Explore | Favourites, search, account. */
export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[var(--container-max)] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:h-16 md:flex-nowrap md:gap-8 md:py-0">
        <Logo />
        <MainTabBar variant="header" />
        {/* Own row on mobile (full width), inline right-aligned from sm up. */}
        <div className="order-last w-full min-w-0 basis-full sm:order-none sm:w-64 sm:basis-auto">
          <SearchBar />
        </div>
        <div className="ms-auto flex items-center gap-4">
          <AuthLink />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
