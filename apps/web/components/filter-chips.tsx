'use client';

import { useTranslations } from 'next-intl';

export type FilterChip = { key: string; label: string };

export function FilterChips({
  items,
  onRemove,
  onClearAll,
}: {
  items: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  const t = useTranslations('Filters');
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('title')}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onRemove(item.key)}
          aria-label={`${t('removeFilter')}: ${item.label}`}
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-maaroud-blue/15 bg-maaroud-blue/5 px-3 py-1.5 text-xs font-medium text-maaroud-blue transition-colors hover:bg-maaroud-blue/10"
        >
          {item.label}
          <span aria-hidden="true" className="text-base leading-none">
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="min-h-9 px-1 text-xs font-medium text-nike-grey underline decoration-stone-grey underline-offset-4 hover:text-maaroud-blue"
      >
        {t('clearAll')}
      </button>
    </div>
  );
}
