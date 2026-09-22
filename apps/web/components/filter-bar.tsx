'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useQueryParams } from '@/lib/use-query-params';
import { facetChoices, shopperFacets } from '@/lib/facet-choices';
import { nextPriceParams } from '@/lib/price-draft';
import {
  CATALOG_FILTER_KEYS,
  categoryHref,
  clearFilterParams,
  priceDraftError,
} from '@/lib/catalog-filters';
import type { BrandSummary, CatalogFacets, CategorySummary } from '@/lib/api/types';
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { CategoryStrip } from './category-strip';

const EMPTY_FACETS: CatalogFacets = { colors: [], sizes: [] };

type FilterValues = Record<string, string | undefined>;
type FilterBarProps = {
  brands: BrandSummary[];
  categories?: CategorySummary[];
  categoryNav?: 'query' | 'path';
  facets?: CatalogFacets;
  current: FilterValues;
  open: boolean;
  onClose: () => void;
  dialogId: string;
};

/** Desktop refinements stay in view; the mobile drawer applies its edits together. */
export function FilterBar(props: FilterBarProps) {
  return (
    <Suspense fallback={null}>
      <FilterBarInner {...props} />
    </Suspense>
  );
}

function FilterBarInner({
  brands,
  categories = [],
  categoryNav = 'query',
  facets = EMPTY_FACETS,
  current,
  open,
  onClose,
  dialogId,
}: FilterBarProps) {
  const t = useTranslations('Filters');
  const { searchParams, pushParams } = useQueryParams();
  const router = useRouter();
  const [minDraft, setMinDraft] = useState(current.minPrice ?? '');
  const [maxDraft, setMaxDraft] = useState(current.maxPrice ?? '');
  const error = priceDraftError(minDraft, maxDraft);

  useEffect(() => {
    setMinDraft(current.minPrice ?? '');
    setMaxDraft(current.maxPrice ?? '');
  }, [current.minPrice, current.maxPrice]);

  const update = useCallback(
    (key: string, value: string) => {
      // A click can blur a price field and change another filter before the
      // first navigation finishes. Carry that price draft into the same update.
      const params =
        (!error && nextPriceParams(searchParams, minDraft, maxDraft)) ||
        new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key === 'category' && categoryNav === 'path') {
        router.push(categoryHref(value, params) as Parameters<typeof router.push>[0]);
      } else {
        pushParams(params, true);
      }
    },
    [categoryNav, error, maxDraft, minDraft, pushParams, router, searchParams],
  );

  const commitPrice = useCallback(() => {
    if (error) return;
    const next = nextPriceParams(searchParams, minDraft, maxDraft);
    if (next) pushParams(next, true);
  }, [error, maxDraft, minDraft, pushParams, searchParams]);

  const clearAll = () => {
    setMinDraft('');
    setMaxDraft('');
    pushParams(clearFilterParams(searchParams), true);
  };
  const hasFilters = CATALOG_FILTER_KEYS.some((key) => searchParams.has(key));

  return (
    <>
      <aside
        aria-label={t('title')}
        className="sticky top-[calc(var(--header-height,5rem)+1rem)] hidden max-h-[calc(100dvh-var(--header-height,5rem)-2rem)] w-60 shrink-0 self-start overflow-y-auto overscroll-contain rounded-2xl border border-stone-grey bg-white p-4 md:block [scrollbar-gutter:stable]"
      >
        <FilterHeader onClear={clearAll} showClear={hasFilters || Boolean(minDraft || maxDraft)} />
        {categories.length > 0 && (
          <Facet label={t('category')}>
            <CategoryStrip
              categories={categories}
              active={current.category}
              mode={categoryNav}
              vertical
              onSelect={(value) => update('category', value)}
            />
          </Facet>
        )}
        <FacetList
          brands={brands}
          facets={facets}
          current={current}
          update={update}
          minDraft={minDraft}
          maxDraft={maxDraft}
          onMinDraft={setMinDraft}
          onMaxDraft={setMaxDraft}
          onPriceBlur={commitPrice}
          priceError={error}
        />
      </aside>
      {open && (
        <MobileFilters
          brands={brands}
          categories={categories}
          categoryNav={categoryNav}
          facets={facets}
          current={current}
          onClose={onClose}
          dialogId={dialogId}
        />
      )}
    </>
  );
}

function MobileFilters({
  brands,
  categories,
  categoryNav,
  facets,
  current,
  onClose,
  dialogId,
}: {
  brands: BrandSummary[];
  categories: CategorySummary[];
  categoryNav: 'query' | 'path';
  facets: CatalogFacets;
  current: FilterValues;
  onClose: () => void;
  dialogId: string;
}) {
  const t = useTranslations('Filters');
  const { searchParams, pushParams } = useQueryParams();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<FilterValues>({ ...current });
  const error = priceDraftError(draft.minPrice ?? '', draft.maxPrice ?? '');
  const headingId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    // A desktop resize must release the mobile dialog and its scroll lock.
    const desktop = window.matchMedia('(min-width: 768px)');
    const onResize = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener('change', onResize);
    onResize();
    return () => {
      desktop.removeEventListener('change', onResize);
      element.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onClose]);

  const update = (key: string, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const clearAll = () => setDraft(categoryNav === 'path' ? { category: current.category } : {});
  const hasFilters = CATALOG_FILTER_KEYS.some(
    (key) => (key !== 'category' || categoryNav === 'query') && Boolean(draft[key]),
  );

  const apply = () => {
    if (error) return;
    const params = new URLSearchParams(searchParams.toString());
    for (const key of CATALOG_FILTER_KEYS) {
      const value = draft[key]?.trim();
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page');
    if (categoryNav === 'path') {
      const href = categoryHref(draft.category ?? '', params);
      router.push(href as Parameters<typeof router.push>[0]);
    } else {
      pushParams(params, true);
    }
    onClose();
  };

  return (
    <dialog
      ref={dialog}
      id={dialogId}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-y-0 start-0 end-auto m-0 h-[100dvh] max-h-none w-[90vw] max-w-sm border-0 bg-white p-0 text-ink-black shadow-xl backdrop:bg-ink-black/40 md:hidden"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b border-stone-grey px-5 py-4">
          <h2 id={headingId} className="flex-1 text-lg font-semibold">
            {t('title')}
          </h2>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="min-h-10 text-sm font-medium text-maaroud-blue"
            >
              {t('clearAll')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('hideFilters')}
            autoFocus
            className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-ivory text-xl"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5">
          {categories.length > 0 && (
            <Facet label={t('category')}>
              <CategoryStrip
                categories={categories}
                active={draft.category}
                mode={categoryNav}
                vertical
                onSelect={(value) => update('category', value)}
              />
            </Facet>
          )}
          <FacetList
            brands={brands}
            facets={facets}
            current={draft}
            update={update}
            minDraft={draft.minPrice ?? ''}
            maxDraft={draft.maxPrice ?? ''}
            onMinDraft={(value) => update('minPrice', value)}
            onMaxDraft={(value) => update('maxPrice', value)}
            priceError={error}
          />
        </div>
        <div className="border-t border-stone-grey bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={apply}
            disabled={Boolean(error)}
            className="min-h-12 w-full rounded-xl bg-maaroud-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-maaroud-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('apply')}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function FilterHeader({ onClear, showClear }: { onClear: () => void; showClear: boolean }) {
  const t = useTranslations('Filters');
  return (
    <div className="flex min-h-10 items-center justify-between gap-2 border-b border-stone-grey pb-3">
      <h2 className="text-base font-semibold text-ink-black">{t('title')}</h2>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-maaroud-blue hover:underline"
        >
          {t('clearAll')}
        </button>
      )}
    </div>
  );
}

function FacetList({
  brands,
  facets,
  current,
  update,
  minDraft,
  maxDraft,
  onMinDraft,
  onMaxDraft,
  onPriceBlur,
  priceError,
}: {
  brands: BrandSummary[];
  facets: CatalogFacets;
  current: FilterValues;
  update: (key: string, value: string) => void;
  minDraft: string;
  maxDraft: string;
  onMinDraft: (value: string) => void;
  onMaxDraft: (value: string) => void;
  onPriceBlur?: () => void;
  priceError?: 'nonNegativePrice' | 'invalidRange';
}) {
  const t = useTranslations('Filters');
  const errorId = useId();
  const shown = shopperFacets(facets);
  const colors = facetChoices(shown.colors, current.color);
  const sizes = facetChoices(shown.sizes, current.size);
  return (
    <div className="flex flex-col">
      {brands.length > 0 && (
        <Facet label={t('brand')}>
          <Select
            label={t('brand')}
            value={current.brand ?? ''}
            onChange={(event) => update('brand', event.target.value)}
            options={[
              { value: '', label: t('all') },
              ...brands.map((brand) => ({
                value: brand.slug,
                label: `${brand.name} (${brand.productCount})`,
              })),
            ]}
          />
        </Facet>
      )}
      <Facet label={t('price')}>
        <p className="text-xs text-nike-grey">{t('priceHint')}</p>
        <div className="flex items-start gap-2">
          <NumberField
            value={minDraft}
            onChange={onMinDraft}
            onBlur={onPriceBlur}
            label={t('minPrice')}
            invalid={Boolean(priceError)}
            errorId={priceError ? errorId : undefined}
          />
          <NumberField
            value={maxDraft}
            onChange={onMaxDraft}
            onBlur={onPriceBlur}
            label={t('maxPrice')}
            invalid={Boolean(priceError)}
            errorId={priceError ? errorId : undefined}
          />
        </div>
        {priceError && (
          <p id={errorId} role="alert" className="text-xs text-alert-red">
            {t(priceError)}
          </p>
        )}
      </Facet>
      <Facet label={t('availability')}>
        <Select
          label={t('availability')}
          value={current.availability ?? ''}
          onChange={(event) => update('availability', event.target.value)}
          options={[
            { value: '', label: t('all') },
            { value: 'in_stock', label: t('in_stock') },
            { value: 'out_of_stock', label: t('out_of_stock') },
            { value: 'unknown', label: t('unknown') },
          ]}
        />
      </Facet>
      {colors.length > 0 && (
        <Facet label={t('color')}>
          <ChoiceList
            values={colors}
            selected={current.color}
            onSelect={(value) => update('color', value)}
          />
        </Facet>
      )}
      {sizes.length > 0 && (
        <Facet label={t('size')}>
          <ChoiceList
            values={sizes}
            selected={current.size}
            onSelect={(value) => update('size', value)}
          />
        </Facet>
      )}
    </div>
  );
}

function ChoiceList({
  values,
  selected,
  onSelect,
}: {
  values: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ul className="flex max-h-48 flex-wrap gap-2 overflow-y-auto p-0.5">
      {values.map((value) => {
        const active = selected?.toLocaleLowerCase() === value.toLocaleLowerCase();
        return (
          <li key={value}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? '' : value)}
              className={`min-h-10 rounded-lg border px-3 py-2 text-xs transition-colors ${active ? 'border-maaroud-blue bg-maaroud-blue/10 font-semibold text-maaroud-blue' : 'border-stone-grey text-ink-black hover:border-maaroud-blue'}`}
            >
              {value}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Facet({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-stone-grey py-3 last:border-b-0">
      <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-ink-black">
        {label}
        <span
          aria-hidden="true"
          className="text-nike-grey transition-transform group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={onChange}
      className="min-h-11 w-full min-w-0 rounded-xl border border-stone-grey bg-white px-3 py-2 text-sm text-ink-black focus:border-maaroud-blue"
    >
      {options.map((option) => (
        <option key={option.value || 'all'} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function NumberField({
  value,
  onChange,
  onBlur,
  label,
  invalid,
  errorId,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label: string;
  invalid: boolean;
  errorId?: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs text-nike-grey">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder="—"
        className={`min-h-11 w-full min-w-0 rounded-xl border bg-white px-2.5 py-2 text-sm text-ink-black focus:border-maaroud-blue ${invalid ? 'border-alert-red' : 'border-stone-grey'}`}
      />
    </label>
  );
}
