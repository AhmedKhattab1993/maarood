"use client";

import { useTranslations } from "next-intl";

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
  const t = useTranslations("Filters");
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onRemove(item.key)}
          aria-label={`${t("removeFilter")}: ${item.label}`}
          className="inline-flex items-center gap-1 border border-stone-grey bg-white px-2 py-1 text-xs text-ink-black hover:border-ink-black"
        >
          {item.label}
          <span aria-hidden>×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-maaroud-blue hover:underline"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
