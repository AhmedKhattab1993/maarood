import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { MainTabBar } from "./main-tab-bar";
import { AuthLink } from "./auth-link";
import { SearchBar } from "./search-bar";

/** Top bar: logo, search, Following | Explore | Favourites, account. */
export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-grey bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-[var(--container-max)] px-4">
        <div className="flex min-h-14 items-center gap-3 py-2 md:min-h-16 md:gap-6">
          <Logo />
          {/* Desktop search sits in the row. Mobile search is the row below so it does not fight the tabs. */}
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar />
          </div>
          <MainTabBar variant="header" />
          <div className="ms-auto flex items-center gap-4">
            <AuthLink />
            <LanguageSwitcher />
          </div>
        </div>
        <div className="pb-3 md:hidden">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
