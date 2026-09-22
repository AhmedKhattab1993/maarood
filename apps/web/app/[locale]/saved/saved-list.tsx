'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { listSaved } from '@/lib/saved';
import { getAuthToken } from '@/lib/auth';
import { publicBackendUrl } from '@/lib/api/backend-url';
import { ApiError, type BrandSummary, type SavedProduct } from '@/lib/api/types';
import { ProductGrid, ProductGridSkeleton } from '@/components/product-grid';
import { EmptyState } from '@/components/state-views';
import { Link } from '@/i18n/navigation';

/** Saved items stay on the grid and disappear immediately when removed. */
export function SavedList({
  emptyTitle,
  emptyHint,
  browseLabel,
}: {
  emptyTitle: string;
  emptyHint: string;
  browseLabel: string;
}) {
  const tNav = useTranslations('Nav');
  const tAuth = useTranslations('Auth');
  const tState = useTranslations('State');
  const t = useTranslations('Favourites');
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'anon' }
    | { status: 'empty' }
    | { status: 'ready'; items: SavedProduct[]; brands: BrandSummary[] }
    | { status: 'error' }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState({ status: 'loading' });
      if (!getAuthToken()) {
        if (!cancelled) setState({ status: 'anon' });
        return;
      }
      try {
        const [items, brands] = await Promise.all([listSaved(), loadBrands()]);
        if (cancelled) return;
        setState(items.length === 0 ? { status: 'empty' } : { status: 'ready', items, brands });
      } catch (err) {
        if (cancelled) return;
        setState({ status: err instanceof ApiError && err.status === 401 ? 'anon' : 'error' });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    const refresh = () => setReload((value) => value + 1);
    window.addEventListener('maarood:auth-change', refresh);
    return () => window.removeEventListener('maarood:auth-change', refresh);
  }, []);

  let body: React.ReactNode;
  if (state.status === 'loading') {
    body = <ProductGridSkeleton layout="grid" />;
  } else if (state.status === 'anon') {
    body = (
      <EmptyState
        title={t('loginHint')}
        hint={emptyHint}
        action={
          <Link
            href={{ pathname: '/login' }}
            className="rounded-full bg-maaroud-blue px-5 py-3 text-sm font-medium text-white hover:bg-maaroud-blue-dark"
          >
            {tAuth('login')}
          </Link>
        }
      />
    );
  } else if (state.status === 'empty' || (state.status === 'ready' && state.items.length === 0)) {
    body = (
      <EmptyState
        title={emptyTitle}
        hint={emptyHint}
        action={
          <Link
            href={{ pathname: '/' }}
            className="rounded-full bg-maaroud-blue px-5 py-3 text-sm font-medium text-white hover:bg-maaroud-blue-dark"
          >
            {browseLabel}
          </Link>
        }
      />
    );
  } else if (state.status === 'error') {
    body = (
      <EmptyState
        title={tState('error')}
        action={
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="rounded-full border border-stone-grey bg-white px-5 py-2.5 text-sm font-medium text-ink-black hover:bg-warm-ivory"
          >
            {tState('retry')}
          </button>
        }
      />
    );
  } else {
    body = (
      <ProductGrid
        layout="grid"
        products={state.items.map((item) => item.product)}
        brands={state.brands}
        allSaved
        onUnsaved={(productId) =>
          setState((current) =>
            current.status === 'ready'
              ? {
                  ...current,
                  items: current.items.filter((item) => item.product.id !== productId),
                }
              : current,
          )
        }
      />
    );
  }

  return (
    <section aria-labelledby="saved-heading">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-grey pb-6">
        <div>
          <h1 id="saved-heading" className="text-3xl font-semibold tracking-tight text-ink-black">
            {tNav('favourites')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-nike-grey">{emptyHint}</p>
        </div>
        <Link
          href={{ pathname: '/' }}
          className="inline-flex items-center gap-2 text-sm font-medium text-maaroud-blue hover:underline"
        >
          {browseLabel}
          <span aria-hidden className="rtl:rotate-180">
            ↗
          </span>
        </Link>
      </div>
      {body}
    </section>
  );
}

async function loadBrands(): Promise<BrandSummary[]> {
  try {
    const res = await fetch(`${publicBackendUrl()}/v1/brands`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return (await res.json()) as BrandSummary[];
  } catch {
    return [];
  }
}
