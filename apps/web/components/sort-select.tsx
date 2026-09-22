'use client';

import { useTranslations } from 'next-intl';
import { useQueryParams } from '@/lib/use-query-params';
import { Suspense, useCallback, type ChangeEvent } from 'react';
import type { ProductSort } from '@/lib/api/types';

const SORTS: ProductSort[] = ['newest', 'price_asc', 'price_desc', 'relevance'];

export function SortSelect({
  current,
  personalized = false,
}: {
  current?: ProductSort;
  personalized?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <SortSelectInner current={current} personalized={personalized} />
    </Suspense>
  );
}

function SortSelectInner({
  current,
  personalized,
}: {
  current?: ProductSort;
  personalized: boolean;
}) {
  const t = useTranslations('Sort');
  const { searchParams, pushParams } = useQueryParams();

  const onChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (e.target.value) params.set('sort', e.target.value);
      else params.delete('sort');
      pushParams(params, true);
    },
    [pushParams, searchParams],
  );

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink-black">
      <span className="hidden sm:inline">{t('label')}</span>
      <select
        value={current ?? (personalized ? '' : 'newest')}
        onChange={onChange}
        aria-label={t('label')}
        className="min-h-11 max-w-full cursor-pointer rounded-xl border border-stone-grey bg-white px-3 py-2 text-sm font-medium text-ink-black focus:border-maaroud-blue"
      >
        {personalized && <option value="">{t('forYou')}</option>}
        {SORTS.filter(
          (s) => s !== 'relevance' || searchParams.has('q') || current === 'relevance',
        ).map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </select>
    </label>
  );
}
