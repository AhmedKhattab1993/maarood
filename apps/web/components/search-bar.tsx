'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { publicSearchProducts } from '@/lib/api/public-client';
import type { SearchResult } from '@/lib/api/types';
import { CATEGORY_LABELS } from '@/lib/categories';
import { formatPrice } from '@/lib/format';
import { normalizeSearchText, parseRecentSearches, rememberSearch } from '@/lib/search-suggestions';
import { BrandAvatar } from './brand-avatar';

const RECENT_KEY = 'maarood:recent-searches';
const suggestionCache = new Map<string, { expires: number; result: SearchResult }>();

type Suggestion = {
  kind: 'query' | 'brand' | 'product' | 'category';
  value: string;
  title: string;
  detail?: string;
  image?: string | null;
};

/** One search field in the header, with bounded, debounced catalog suggestions. */
export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const t = useTranslations('Search');
  return (
    <Suspense
      fallback={
        <div className="flex h-12 items-center gap-3 rounded-xl border border-stone-grey bg-warm-ivory px-4 text-sm text-nike-grey">
          <SearchIcon />
          <span>{t('placeholder')}</span>
        </div>
      }
    >
      <SearchBarInner autoFocus={autoFocus} />
    </Suspense>
  );
}

function SearchBarInner({ autoFocus }: { autoFocus: boolean }) {
  const t = useTranslations('Search');
  const tCategory = useTranslations('Category');
  const tNav = useTranslations('Nav');
  const tState = useTranslations('State');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeQuery = pathname === '/search' ? (searchParams.get('q') ?? '') : '';
  const [value, setValue] = useState(routeQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const query = value.trim();

  // The header persists between routes, including browser Back and Forward.
  useEffect(() => {
    setValue(routeQuery);
    setOpen(false);
    setActiveIndex(-1);
  }, [pathname, routeQuery]);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setFailed(false);
    setLoading(false);
    if (!open || query.length < 2) return;

    const cached = suggestionCache.get(query);
    if (cached && cached.expires > Date.now()) {
      setResult(cached.result);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      void publicSearchProducts(query, { limit: 4, page: 1 })
        .then((next) => {
          if (cancelled) return;
          if (suggestionCache.size >= 20) {
            const oldest = suggestionCache.keys().next().value;
            if (oldest !== undefined) suggestionCache.delete(oldest);
          }
          suggestionCache.set(query, { expires: Date.now() + 60_000, result: next });
          setResult(next);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    if (activeIndex >= 0) {
      document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, listId]);

  function readRecent() {
    try {
      setRecent(parseRecentSearches(localStorage.getItem(RECENT_KEY)));
    } catch {
      setRecent([]);
    }
  }

  function saveQuery(nextQuery: string) {
    const next = rememberSearch(recent, nextQuery);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* Storage is optional. */
    }
  }

  function search(nextQuery: string) {
    const trimmed = nextQuery.trim();
    if (trimmed) saveQuery(trimmed);
    setValue(trimmed);
    setOpen(false);
    setActiveIndex(-1);
    const params =
      pathname === '/search' ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();
    params.delete('page');
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    router.push({ pathname: '/search', query: Object.fromEntries(params) });
  }

  function select(suggestion: Suggestion) {
    if (suggestion.kind === 'query') {
      search(suggestion.value);
      return;
    }
    if (query) saveQuery(query);
    setOpen(false);
    setActiveIndex(-1);
    if (suggestion.kind === 'brand') {
      router.push({ pathname: '/brands/[slug]', params: { slug: suggestion.value } });
    } else if (suggestion.kind === 'category') {
      router.push({ pathname: '/c/[category]', params: { category: suggestion.value } });
    } else {
      router.push({ pathname: '/p/[id]', params: { id: suggestion.value } });
    }
  }

  const categorySuggestions: Suggestion[] = Object.keys(CATEGORY_LABELS)
    .filter((key) => key !== 'other')
    .filter(
      (key) =>
        !query ||
        normalizeSearchText(`${key} ${tCategory(key)}`).includes(normalizeSearchText(query)),
    )
    .slice(0, query ? 2 : 5)
    .map((key) => ({
      kind: 'category',
      value: key,
      title: tCategory(key),
      detail: tNav('categories'),
    }));
  const suggestions: Suggestion[] = query
    ? [
        { kind: 'query', value: query, title: t('viewAll', { query }) },
        ...categorySuggestions,
        ...(result?.brands ?? []).slice(0, 2).map((brand): Suggestion => ({
          kind: 'brand',
          value: brand.slug,
          title: brand.name,
          detail: t('brands'),
          image: brand.logoUrl,
        })),
        ...(result?.items ?? []).slice(0, 4).map((product): Suggestion => ({
          kind: 'product',
          value: product.id,
          title: product.title,
          detail: `${product.vendor} · ${formatPrice(product.currentPrice, product.currency, locale)}`,
          image: product.imageUrls[0],
        })),
      ]
    : [
        ...recent.map((item): Suggestion => ({
          kind: 'query',
          value: item,
          title: item,
          detail: t('recent'),
        })),
        ...categorySuggestions,
      ];

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => {
        if (index < 0) return direction > 0 ? 0 : suggestions.length - 1;
        return (index + direction + suggestions.length) % suggestions.length;
      });
    } else if (event.key === 'Enter' && open && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      select(suggestions[activeIndex]);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search(value);
  }

  return (
    <form
      onSubmit={onSubmit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      role="search"
      className="relative w-full"
    >
      <div className="flex h-12 items-center gap-2 rounded-xl border border-stone-grey bg-warm-ivory ps-3 pe-1.5 transition focus-within:border-maaroud-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-maaroud-blue/10">
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          name="q"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setResult(null);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            readRecent();
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          autoComplete="off"
          maxLength={120}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink-black outline-none placeholder:text-nike-grey/80 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label={t('clear')}
            onClick={() => {
              setValue('');
              setResult(null);
              setOpen(true);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-nike-grey transition hover:bg-stone-grey"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden
            >
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="h-9 shrink-0 rounded-lg bg-ink-black px-3 text-xs font-semibold text-white transition hover:bg-maaroud-blue"
        >
          {t('submit')}
        </button>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-grey bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-stone-grey/70 px-4 py-3">
            <span className="text-xs font-semibold text-nike-grey">
              {t(query ? 'suggestions' : recent.length ? 'recent' : 'exploreCategories')}
            </span>
            {!query && recent.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRecent([]);
                  try {
                    localStorage.removeItem(RECENT_KEY);
                  } catch {
                    /* Storage is optional. */
                  }
                  inputRef.current?.focus();
                }}
                className="text-xs text-maaroud-blue hover:underline"
              >
                {t('clearRecent')}
              </button>
            )}
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label={t('suggestions')}
            aria-busy={loading}
            className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.kind}-${suggestion.value}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${activeIndex === index ? 'bg-maaroud-blue/7' : 'hover:bg-warm-ivory'}`}
              >
                {suggestion.kind === 'brand' ? (
                  <BrandAvatar name={suggestion.title} logoUrl={suggestion.image} size={36} />
                ) : suggestion.kind === 'product' && suggestion.image ? (
                  <img
                    src={suggestion.image}
                    alt=""
                    width={36}
                    height={44}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-11 w-9 shrink-0 rounded-md bg-warm-ivory object-contain"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warm-ivory text-nike-grey">
                    <SearchIcon />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-black">
                    {suggestion.title}
                  </span>
                  {suggestion.detail && (
                    <span className="block truncate text-xs text-nike-grey">
                      {suggestion.detail}
                    </span>
                  )}
                </span>
                <span aria-hidden className="text-nike-grey rtl:rotate-180">
                  ↗
                </span>
              </li>
            ))}
          </ul>
          {(loading || failed || query) && (
            <p
              role="status"
              className="border-t border-stone-grey/70 px-4 py-2.5 text-xs text-nike-grey"
            >
              {loading
                ? tState('loading')
                : failed
                  ? t('suggestionsUnavailable')
                  : t('suggestionHint')}
            </p>
          )}
        </div>
      )}
    </form>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-nike-grey"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
