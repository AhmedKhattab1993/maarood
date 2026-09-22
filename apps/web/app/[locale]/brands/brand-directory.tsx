'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { BrandSummary } from '@/lib/api/types';
import { matchingBrands } from '@/lib/search-suggestions';
import { BrandAvatar } from '@/components/brand-avatar';
import { FollowButton } from '@/components/follow-button';
import { EmptyState } from '@/components/state-views';

export function BrandDirectory({ brands }: { brands: BrandSummary[] }) {
  const t = useTranslations('Brand');
  const tSearch = useTranslations('Search');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const visible = matchingBrands(brands, query).sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-grey bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex w-full items-center gap-3 rounded-xl border border-stone-grey bg-warm-ivory px-3 sm:max-w-md">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-nike-grey"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <span className="sr-only">{t('searchPlaceholder')}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink-black outline-none"
          />
        </label>
        <p aria-live="polite" className="text-sm text-nike-grey">
          {t('brandsCount', { count: visible.length })}
        </p>
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title={t('noBrands')}
          hint={query ? t('noBrandsHint') : undefined}
          action={
            query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded-full bg-maaroud-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-maaroud-blue-dark"
              >
                {tSearch('clear')}
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {visible.map((brand) => (
            <li
              key={brand.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-grey bg-white transition hover:border-maaroud-blue/40 hover:shadow-sm"
            >
              <Link
                href={{ pathname: '/brands/[slug]', params: { slug: brand.slug } }}
                className="group flex flex-1 flex-col items-start p-4 md:p-5"
              >
                <span className="mb-5 overflow-hidden rounded-xl border border-stone-grey/70 bg-warm-ivory p-2">
                  <BrandAvatar name={brand.name} logoUrl={brand.logoUrl} size={56} />
                </span>
                <span className="break-words text-base font-semibold text-ink-black group-hover:text-maaroud-blue">
                  {brand.name}
                </span>
                <span className="mt-1 text-xs text-nike-grey">
                  {t('productsCount', { count: brand.productCount })}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-maaroud-blue">
                  {t('viewCollection')}{' '}
                  <span aria-hidden className="rtl:rotate-180">
                    ↗
                  </span>
                </span>
              </Link>
              <div className="border-t border-stone-grey/70 px-4 py-3 md:px-5">
                <FollowButton merchantId={brand.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
