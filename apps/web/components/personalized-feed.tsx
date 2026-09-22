'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BrandSummary, PaginatedResult, ProductQuery, PublicProduct } from '@/lib/api/types';
import { publicGetPersonalizedFeed, type PersonalizedFeedRequest } from '@/lib/api/public-client';
import { getAuthToken } from '@/lib/auth';
import {
  discoveryIdentity,
  readDiscoveryHistory,
  recordSeenProducts,
} from '@/lib/discovery-profile';
import { mergeUniqueById } from '@/lib/feed-append';
import { ProductGrid, ProductGridSkeleton } from './product-grid';
import { EmptyState } from './state-views';

type FeedSnapshot = Omit<PersonalizedFeedRequest, 'page'> & { token: string | null };
type FeedState = 'loading' | 'refreshing' | 'more' | 'idle';

/** Each visit gets a fresh, private ranking. Paging holds its preferences and exposure history fixed. */
export function PersonalizedFeed({
  query,
  brands,
}: {
  query: ProductQuery;
  brands?: BrandSummary[];
}) {
  const t = useTranslations('Feed');
  const state = useTranslations('State');
  const [result, setResult] = useState<PaginatedResult<PublicProduct> | null>(null);
  const [status, setStatus] = useState<FeedState>('loading');
  const [error, setError] = useState<'refresh' | 'more' | null>(null);
  const [freshReady, setFreshReady] = useState(false);
  const [updated, setUpdated] = useState(false);
  const snapshot = useRef<FeedSnapshot | null>(null);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  const queryKey = JSON.stringify(query);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    busy.current = true;
    setStatus(snapshot.current ? 'refreshing' : 'loading');
    setError(null);
    const history = readDiscoveryHistory();
    const next: FeedSnapshot = {
      // This is a shuffle seed, not a credential. HTTP previews may lack randomUUID.
      seed: `${Date.now()}:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      limit: 24,
      query: JSON.parse(queryKey) as ProductQuery,
      profile: { categories: history.categories, merchants: history.merchants },
      seenIds: history.seen.map((entry) => entry.id),
      token: getAuthToken(),
    };
    try {
      const { token, ...body } = next;
      const response = await publicGetPersonalizedFeed(
        { ...body, page: 1 },
        token,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        discoveryIdentity(token) !== discoveryIdentity(getAuthToken())
      )
        return;
      const isRefresh = snapshot.current !== null;
      snapshot.current = next;
      setResult(response);
      setUpdated(isRefresh);
      setFreshReady(false);
    } catch {
      if (!controller.signal.aborted) setError('refresh');
    } finally {
      if (!controller.signal.aborted) {
        busy.current = false;
        setStatus('idle');
      }
    }
  }, [queryKey]);

  useEffect(() => {
    snapshot.current = null;
    setResult(null);
    setUpdated(false);
    void refresh();
    const onAccountChange = () => {
      snapshot.current = null;
      setResult(null);
      void refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'maarood.auth-token') onAccountChange();
    };
    window.addEventListener('maarood:auth-change', onAccountChange);
    window.addEventListener('storage', onStorage);
    return () => {
      request.current?.abort();
      window.removeEventListener('maarood:auth-change', onAccountChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  useEffect(() => {
    let hiddenAt = Date.now();
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (Date.now() - hiddenAt > 120_000) setFreshReady(true);
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setFreshReady(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  useEffect(() => {
    if (!result || !grid.current || !('IntersectionObserver' in window)) return;
    const observed = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        const ids: string[] = [];
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.productId;
          if (entry.isIntersecting && id && !observed.has(id)) {
            observed.add(id);
            ids.push(id);
            observer.unobserve(entry.target);
          }
        }
        if (ids.length) recordSeenProducts(ids);
      },
      { threshold: 0.45 },
    );
    grid.current
      .querySelectorAll('[data-product-id]')
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [result]);

  const loadMore = async () => {
    if (busy.current || !snapshot.current || !result) return;
    busy.current = true;
    const controller = new AbortController();
    request.current = controller;
    const { token, ...body } = snapshot.current;
    setStatus('more');
    setError(null);
    try {
      const next = await publicGetPersonalizedFeed(
        { ...body, page: result.page + 1 },
        token,
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        discoveryIdentity(token) !== discoveryIdentity(getAuthToken())
      )
        return;
      setResult((previous) =>
        previous ? { ...next, items: mergeUniqueById(previous.items, next.items) } : next,
      );
    } catch {
      if (!controller.signal.aborted) setError('more');
    } finally {
      if (!controller.signal.aborted) {
        busy.current = false;
        setStatus('idle');
      }
    }
  };

  const hasMore = result !== null && result.page * result.limit < result.total;
  const refreshing = status === 'loading' || status === 'refreshing';

  return (
    <section className="flex min-w-0 flex-col gap-6" aria-label={t('title')}>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-maaroud-blue/15 bg-maaroud-blue/5 p-3 md:p-4">
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-nike-grey md:text-sm">
          <span className="md:hidden">{t('shortHint')}</span>
          <span className="hidden md:inline">{t('hint')}</span>
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={status !== 'idle'}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-pill bg-maaroud-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-maaroud-blue-dark disabled:opacity-60"
        >
          <svg
            className={refreshing ? 'animate-spin' : undefined}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M20 7v5h-5M4 17v-5h5" />
            <path d="M6.1 6.1A8 8 0 0 1 19.5 10M4.5 14A8 8 0 0 0 17.9 17.9" />
          </svg>
          {refreshing ? t('refreshing') : freshReady ? t('freshReady') : t('refresh')}
        </button>
      </div>
      <span role="status" className="sr-only">
        {refreshing ? t('loading') : updated ? t('updated') : ''}
      </span>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-alert-red/20 p-4 text-sm"
        >
          <p>{error === 'refresh' ? t('refreshError') : state('retryLoad')}</p>
          <button
            type="button"
            className="min-h-11 font-semibold text-maaroud-blue hover:underline"
            onClick={() => void (error === 'refresh' ? refresh() : loadMore())}
          >
            {state('retry')}
          </button>
        </div>
      )}
      {status === 'loading' && !result ? (
        <ProductGridSkeleton />
      ) : result?.items.length === 0 ? (
        <EmptyState title={t('empty')} hint={t('emptyHint')} />
      ) : result ? (
        <div
          ref={grid}
          aria-busy={refreshing}
          className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}
        >
          <ProductGrid products={result.items} brands={brands} />
        </div>
      ) : null}
      {hasMore && error !== 'more' && (
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={status !== 'idle'}
            className="min-h-11 rounded-pill border border-stone-grey bg-white px-6 py-3 text-sm font-semibold hover:border-ink-black disabled:opacity-50"
          >
            {status === 'more' ? state('loading') : state('loadMore')}
          </button>
        </div>
      )}
      {result && !hasMore && result.items.length > 0 && (
        <p className="py-4 text-center text-sm text-nike-grey">{t('caughtUp')}</p>
      )}
    </section>
  );
}
