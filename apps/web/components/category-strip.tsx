'use client';

import { Suspense } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { categoryName } from '@/lib/categories';
import { useQueryParams } from '@/lib/use-query-params';
import { categoryHref } from '@/lib/catalog-filters';
import type { CategorySummary } from '@/lib/api/types';

type Href = Parameters<typeof Link>[0]['href'];

/** Compact mobile categories, or a vertical navigation inside the filter rail. */
export function CategoryStrip({
  categories,
  active,
  mode = 'query',
  vertical = false,
  onSelect,
}: {
  categories: CategorySummary[];
  active?: string;
  /** `query` sets ?category= on this page. `path` opens /c/[category]. */
  mode?: 'query' | 'path';
  vertical?: boolean;
  /** The mobile drawer stages category changes until Apply. */
  onSelect?: (value: string) => void;
}) {
  if (categories.length === 0) return null;
  return (
    <Suspense fallback={null}>
      <CategoryStripInner
        categories={categories}
        active={active}
        mode={mode}
        vertical={vertical}
        onSelect={onSelect}
      />
    </Suspense>
  );
}

function CategoryStripInner({
  categories,
  active,
  mode,
  vertical,
  onSelect,
}: {
  categories: CategorySummary[];
  active?: string;
  mode: 'query' | 'path';
  vertical: boolean;
  onSelect?: (value: string) => void;
}) {
  const t = useTranslations('Filters');
  const tCat = useTranslations('Category');
  const tHome = useTranslations('Home');
  const format = useFormatter();
  const { searchParams, pushParams } = useQueryParams();

  function selectQuery(value: string) {
    if (onSelect) {
      onSelect(value);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('category', value);
    else params.delete('category');
    pushParams(params, true);
  }

  return (
    <nav
      aria-label={tHome('shopByCategory')}
      className={vertical ? 'min-w-0' : 'overflow-x-auto pb-1'}
    >
      <ul className={vertical ? 'flex flex-col gap-1' : 'flex w-max flex-nowrap gap-2'}>
        <li>
          {mode === 'path' && !onSelect ? (
            <ChipLink href={categoryHref('', searchParams)} active={!active} vertical={vertical}>
              {t('all')}
            </ChipLink>
          ) : (
            <ChipButton active={!active} vertical={vertical} onClick={() => selectQuery('')}>
              {t('all')}
            </ChipButton>
          )}
        </li>
        {categories.map((category) => {
          const isActive = category.name === active;
          const label = categoryName(category.name, tCat);
          const content = (
            <>
              <span>{label}</span>
              <span
                className="text-xs tabular-nums opacity-70"
                aria-label={t('categoryCount', { count: category.productCount })}
              >
                {format.number(category.productCount)}
              </span>
            </>
          );
          return (
            <li key={category.name}>
              {mode === 'path' && !onSelect ? (
                <ChipLink
                  href={categoryHref(isActive ? '' : category.name, searchParams)}
                  active={isActive}
                  vertical={vertical}
                >
                  {content}
                </ChipLink>
              ) : (
                <ChipButton
                  active={isActive}
                  vertical={vertical}
                  onClick={() => selectQuery(isActive ? '' : category.name)}
                >
                  {content}
                </ChipButton>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function chipClass(active: boolean, vertical: boolean): string {
  return `inline-flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-start text-sm transition-colors ${vertical ? 'w-full justify-between' : 'whitespace-nowrap border'} ${
    active
      ? 'border-maaroud-blue/20 bg-maaroud-blue/10 font-semibold text-maaroud-blue'
      : 'border-stone-grey text-ink-black hover:bg-warm-ivory'
  }`;
}

function ChipButton({
  active,
  vertical,
  onClick,
  children,
}: {
  active: boolean;
  vertical: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={chipClass(active, vertical)}
    >
      {children}
    </button>
  );
}

function ChipLink({
  href,
  active,
  vertical,
  children,
}: {
  href: string;
  active: boolean;
  vertical: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as Href}
      aria-current={active ? 'page' : undefined}
      className={chipClass(active, vertical)}
    >
      {children}
    </Link>
  );
}
