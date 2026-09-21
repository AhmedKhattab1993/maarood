import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { MainTabBar } from "./main-tab-bar";
import { AuthLink } from "./auth-link";

/** Top bar: logo, Following | Explore | Favourites, account. */
export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-grey bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[var(--container-max)] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:h-16 md:flex-nowrap md:gap-8 md:py-0">
        {/* Equal side columns keep the tabs centered regardless of side widths. */}
        <div className="flex flex-1 items-center">
          <Logo />
        </div>
        <MainTabBar variant="header" />
        <div className="flex flex-1 items-center justify-end gap-4">
          <AuthLink />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
