'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BrandSummary, PaginatedResult, PublicProduct } from '@/lib/api/types';
import { publicFetchDiscoveryPage, type DiscoverySource } from '@/lib/api/public-client';
import { mergeUniqueById } from '@/lib/feed-append';
import { ProductGrid } from './product-grid';
import type { ProductLayout } from './product-feed-layout';
import { PersonalizedFeed } from './personalized-feed';

type CachedFeed = {
  items: PublicProduct[];
  page: number;
  total: number;
};

function cacheKey(pathname: string, source: DiscoverySource): string {
  return `maarood.feed:${pathname}:${JSON.stringify(source)}`;
}

function readCache(key: string): CachedFeed | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFeed;
    if (!Array.isArray(parsed.items) || typeof parsed.page !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: CachedFeed): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode — feed still works without persistence.
  }
}

export function DiscoveryFeed({
  personalized = false,
  ...props
}: {
  initial: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  source: DiscoverySource;
  hideAuthor?: boolean;
  layout?: ProductLayout;
  personalized?: boolean;
}) {
  return personalized ? (
    <PersonalizedFeed query={props.source.query} brands={props.brands} />
  ) : (
    <CatalogFeed {...props} />
  );
}

function CatalogFeed({
  initial,
  brands,
  source,
  hideAuthor = false,
  layout = 'grid',
}: {
  initial: PaginatedResult<PublicProduct>;
  brands?: BrandSummary[];
  source: DiscoverySource;
  /** Hide the author row on cards (brand page already owns the brand identity). */
  hideAuthor?: boolean;
  /** Following stays a single column. Catalog pages use the grid. */
  layout?: ProductLayout;
}) {
  const t = useTranslations('State');
  const pathname = usePathname();
  const key = cacheKey(pathname, source);
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [total, setTotal] = useState(initial.total);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle');

  const sourceKey = JSON.stringify(source);
  const generation = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    generation.current += 1;
    busy.current = false;
    setItems(initial.items);
    setPage(initial.page);
    setTotal(initial.total);
    setLoadState('idle');
    const cached = readCache(key);
    if (cached && cached.items.length > initial.items.length) {
      const merged = mergeUniqueById(initial.items, cached.items);
      setItems(merged);
      setPage(Math.max(initial.page, cached.page));
      setTotal(Math.max(initial.total, cached.total));
    }
    return () => {
      generation.current += 1;
    };
  }, [key, sourceKey, initial]);

  const persist = useCallback(
    (next: CachedFeed) => {
      writeCache(key, next);
    },
    [key],
  );

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const currentGeneration = generation.current;
    setLoadState('loading');
    try {
      const next = await publicFetchDiscoveryPage(source, page + 1);
      if (currentGeneration !== generation.current) return;
      setItems((prev) => {
        const merged = mergeUniqueById(prev, next.items);
        persist({ items: merged, page: next.page, total: next.total });
        return merged;
      });
      setPage(next.page);
      setTotal(next.total);
      setLoadState('idle');
    } catch {
      if (currentGeneration === generation.current) setLoadState('error');
    } finally {
      if (currentGeneration === generation.current) busy.current = false;
    }
  }, [page, persist, source]);

  const hasMore = page * initial.limit < total;

  return (
    <div className="flex flex-col gap-5">
      <ProductGrid products={items} brands={brands} hideAuthor={hideAuthor} layout={layout} />
      {loadState === 'error' && (
        <div className="flex flex-col items-center gap-2 py-4">
          <p role="alert" className="text-sm text-alert-red">
            {t('retryLoad')}
          </p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="rounded-default border border-stone-grey bg-white px-4 py-2 text-sm text-ink-black hover:bg-stone-grey"
          >
            {t('retry')}
          </button>
        </div>
      )}
      {hasMore && loadState !== 'error' && (
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadState === 'loading'}
            className="rounded-default border border-ink-black bg-white px-5 py-2 text-sm font-medium text-ink-black hover:bg-stone-grey disabled:opacity-50"
          >
            {loadState === 'loading' ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
      {!hasMore && items.length > 0 && loadState !== 'error' && (
        <p className="py-4 text-center text-sm text-nike-grey">{t('endOfResults')}</p>
      )}
    </div>
  );
}
