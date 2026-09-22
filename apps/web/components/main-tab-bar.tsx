'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { MAIN_TABS, mainTabIdForPath } from './main-tabs';

/** Three primary destinations. Visual order: Following | Explore | Favourites. */
export function MainTabBar({ variant }: { variant: 'header' | 'mobile' }) {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const active = mainTabIdForPath(pathname);

  const labels: Record<(typeof MAIN_TABS)[number]['id'], string> = {
    following: t('following'),
    explore: t('explore'),
    favourites: t('favourites'),
  };

  if (variant === 'header') {
    return (
      <nav
        aria-label={t('primary')}
        className="hidden shrink-0 items-center justify-center gap-1 text-sm font-medium md:flex md:ms-auto lg:ms-0"
        dir="ltr"
      >
        {MAIN_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={{ pathname: tab.pathname }}
            aria-current={active === tab.id ? 'page' : undefined}
            className={
              active === tab.id
                ? 'inline-flex min-h-11 items-center rounded-pill bg-blue-soft px-4 font-semibold text-maaroud-blue'
                : 'inline-flex min-h-11 items-center rounded-pill px-4 text-nike-grey transition-colors hover:bg-surface hover:text-ink-black'
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
      aria-label={t('primary')}
      dir="ltr"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-grey/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_-16px_#17255440] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-[var(--container-max)] items-stretch justify-around">
        {MAIN_TABS.map((tab) => (
          <li key={tab.id} className="flex-1">
            <Link
              href={{ pathname: tab.pathname }}
              aria-current={active === tab.id ? 'page' : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
                active === tab.id ? 'font-semibold text-maaroud-blue' : 'text-nike-grey'
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-pill ${active === tab.id ? 'bg-blue-soft' : ''}`}
              >
                <TabIcon id={tab.id} />
              </span>
              {labels[tab.id]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TabIcon({ id }: { id: (typeof MAIN_TABS)[number]['id'] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    'aria-hidden': true as const,
  };
  if (id === 'following') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-2.8 2.8-4 5.5-4s4.9 1.2 5.5 4" strokeLinecap="round" />
        <path d="M19 8v6M16 11h6" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'explore') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M6 4h12v16l-6-4-6 4V4z" strokeLinejoin="round" />
    </svg>
  );
}
