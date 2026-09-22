import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Logo } from './logo';

/** Product discovery, account destinations, and a clear route to help. */
export async function SiteFooter() {
  const t = await getTranslations('Footer');
  const tNav = await getTranslations('Nav');
  const tBrand = await getTranslations('Brand');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-stone-grey/80 bg-white">
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-2 gap-x-8 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="col-span-2 flex flex-col items-start gap-4 md:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-nike-grey">{tBrand('promise')}</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink-black">{t('discover')}</p>
          <ul className="flex flex-col text-sm text-nike-grey [&_a]:inline-flex [&_a]:min-h-9 [&_a]:items-center [&_a]:hover:text-maaroud-blue">
            <li>
              <Link href={{ pathname: '/' }} className="transition-colors hover:text-ink-black">
                {tNav('explore')}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: '/following' }}
                className="transition-colors hover:text-ink-black"
              >
                {tNav('following')}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: '/favourites' }}
                className="transition-colors hover:text-ink-black"
              >
                {tNav('favourites')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Shop */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink-black">{t('shop')}</p>
          <ul className="flex flex-col text-sm text-nike-grey [&_a]:inline-flex [&_a]:min-h-9 [&_a]:items-center [&_a]:hover:text-maaroud-blue">
            <li>
              <Link
                href={{ pathname: '/search' }}
                className="transition-colors hover:text-ink-black"
              >
                {tNav('search')}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: '/brands' }}
                className="transition-colors hover:text-ink-black"
              >
                {tNav('brands')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <p className="text-sm font-semibold text-ink-black">{t('help')}</p>
          <ul className="flex flex-col text-sm text-nike-grey [&_a]:inline-flex [&_a]:min-h-9 [&_a]:items-center [&_a]:hover:text-maaroud-blue">
            <li>
              <Link href={{ pathname: '/help' }} className="transition-colors hover:text-ink-black">
                {t('maaroudHelp')}
              </Link>
            </li>
            <li>
              <Link
                href={{ pathname: '/help', hash: 'contact' }}
                className="transition-colors hover:text-ink-black"
              >
                {t('contactMaaroud')}
              </Link>
            </li>
            <li>
              <p className="mt-2 max-w-xs text-xs leading-relaxed">{t('orderHelp')}</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-grey">
        <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-start justify-between gap-2 px-4 pb-24 pt-6 text-xs leading-relaxed text-nike-grey sm:px-6 md:flex-row md:items-center md:pb-6 lg:px-8">
          <p>{t('rights', { year })}</p>
          <p>{t('redirectNote')}</p>
        </div>
      </div>
    </footer>
  );
}
