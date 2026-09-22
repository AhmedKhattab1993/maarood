import { Logo } from './logo';
import { LanguageSwitcher } from './language-switcher';
import { MainTabBar } from './main-tab-bar';
import { AuthLink } from './auth-link';
import { SearchBar } from './search-bar';
import { getTranslations } from 'next-intl/server';

/** Top bar: logo, search, Following | Explore | Favourites, account. */
export async function SiteHeader() {
  const t = await getTranslations('Nav');
  return (
    <header className="sticky top-0 z-40 border-b border-stone-grey/70 bg-white/95 shadow-[0_2px_16px_-12px_#17255440] backdrop-blur-xl">
      <a href="#main-content" className="skip-link">
        {t('skipToContent')}
      </a>
      <div className="mx-auto max-w-[var(--container-max)] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3 md:gap-5 lg:h-20 xl:gap-8">
          <div className="shrink-0">
            <Logo />
          </div>
          {/* The search gets its own row on tablets too, keeping navigation comfortable. */}
          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBar />
          </div>
          <MainTabBar variant="header" />
          <div className="ms-auto flex shrink-0 items-center gap-1 whitespace-nowrap border-s border-stone-grey/80 ps-3 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center [&>a]:px-2 [&>button]:min-h-11">
            <AuthLink />
            <LanguageSwitcher />
          </div>
        </div>
        <div className="pb-4 lg:hidden">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
