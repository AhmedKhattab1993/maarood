import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { SearchBar } from "./search-bar";
import { MainTabBar } from "./main-tab-bar";
import { AuthLink } from "./auth-link";

/** Top bar: logo, Following | Explore | Favourites, search, account. */
export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[var(--container-max)] items-center gap-4 px-4 md:gap-8">
        <Logo />
        <MainTabBar variant="header" />
        <div className="flex flex-1 justify-end gap-4 md:flex-none">
          <div className="w-full max-w-xs">
            <SearchBar />
          </div>
          <AuthLink />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
