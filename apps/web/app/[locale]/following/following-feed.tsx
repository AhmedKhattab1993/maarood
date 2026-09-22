'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getAuthToken, invalidateFollowing, listFollowing } from '@/lib/auth';
import { publicGetBrands, publicGetProducts } from '@/lib/api/public-client';
import {
  ApiError,
  type PaginatedResult,
  type PublicProduct,
  type BrandSummary,
} from '@/lib/api/types';
import { DiscoveryFeed } from '@/components/discovery-feed';
import { ProductGridSkeleton } from '@/components/product-grid';
import { EmptyState } from '@/components/state-views';
import { FollowButton } from '@/components/follow-button';
import { BrandAvatar } from '@/components/brand-avatar';

export function FollowingFeed({
  emptyTitle,
  emptyHint,
  loginHint,
  browseLabel,
}: {
  emptyTitle: string;
  emptyHint: string;
  loginHint: string;
  browseLabel: string;
}) {
  const t = useTranslations('Following');
  const tAuth = useTranslations('Auth');
  const tNav = useTranslations('Nav');
  const tState = useTranslations('State');
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'anon' }
    | { status: 'empty'; suggested: BrandSummary[] }
    | {
        status: 'ready';
        products: PaginatedResult<PublicProduct>;
        brands: BrandSummary[];
        suggested: BrandSummary[];
        merchantIds: string[];
      }
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
        const [followed, allBrands] = await Promise.all([
          listFollowing(),
          publicGetBrands().catch(() => [] as BrandSummary[]),
        ]);
        if (cancelled) return;
        const followedIds = new Set(followed.map((f) => f.merchantId));
        const suggested = allBrands.filter((b) => !followedIds.has(b.id)).slice(0, 8);
        if (followed.length === 0) {
          setState({ status: 'empty', suggested });
          return;
        }
        const merchantIds = followed.map((f) => f.merchantId);
        const page = await publicGetProducts({
          sort: 'newest',
          limit: 24,
          page: 1,
          merchantId: merchantIds,
        });
        const brands: BrandSummary[] = followed.map((f) => ({
          id: f.merchantId,
          name: f.name,
          slug: f.slug,
          domain: '',
          productCount: 0,
          logoUrl: f.logoUrl,
        }));
        if (!cancelled)
          setState({ status: 'ready', products: page, brands, suggested, merchantIds });
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
    window.addEventListener('maarood:following-change', refresh);
    window.addEventListener('maarood:auth-change', refresh);
    return () => {
      window.removeEventListener('maarood:following-change', refresh);
      window.removeEventListener('maarood:auth-change', refresh);
    };
  }, []);

  function refresh() {
    invalidateFollowing();
    setReload((value) => value + 1);
  }

  let body: React.ReactNode;
  if (state.status === 'loading') {
    body = <ProductGridSkeleton layout="feed" />;
  } else if (state.status === 'anon') {
    body = (
      <EmptyState
        title={loginHint}
        hint={t('feedHint')}
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
  } else if (state.status === 'empty') {
    body = (
      <div className="flex flex-col gap-8">
        <EmptyState
          title={emptyTitle}
          hint={emptyHint}
          action={
            <Link
              href={{ pathname: '/brands' }}
              className="rounded-full bg-maaroud-blue px-5 py-3 text-sm font-medium text-white hover:bg-maaroud-blue-dark"
            >
              {tNav('brands')}
            </Link>
          }
        />
        <SuggestedBrands brands={state.suggested} heading={t('suggested')} />
      </div>
    );
  } else if (state.status === 'error') {
    body = (
      <EmptyState
        title={tState('error')}
        action={
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-stone-grey bg-white px-5 py-2.5 text-sm font-medium text-ink-black hover:bg-warm-ivory"
          >
            {tState('retry')}
          </button>
        }
      />
    );
  } else {
    body = (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <section className="min-w-0">
          <h2 className="mb-5 text-lg font-semibold text-ink-black">{t('latest')}</h2>
          {state.products.items.length === 0 ? (
            <EmptyState
              title={tState('empty')}
              action={
                <Link
                  href={{ pathname: '/' }}
                  className="text-sm font-medium text-maaroud-blue hover:underline"
                >
                  {browseLabel}
                </Link>
              }
            />
          ) : (
            <DiscoveryFeed
              key={reload}
              layout="feed"
              initial={state.products}
              brands={state.brands}
              source={{
                kind: 'products',
                query: { sort: 'newest', limit: 24, merchantId: state.merchantIds },
              }}
            />
          )}
        </section>
        <aside className="space-y-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
          <section className="rounded-2xl border border-stone-grey bg-white p-4">
            <h2 className="mb-4 text-sm font-semibold text-ink-black">{t('yourBrands')}</h2>
            <ul className="flex flex-col gap-3">
              {state.brands.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={{ pathname: '/brands/[slug]', params: { slug: brand.slug } }}
                    className="flex items-center gap-3 rounded-xl p-1 text-sm font-medium text-ink-black transition hover:bg-warm-ivory"
                  >
                    <BrandAvatar name={brand.name} logoUrl={brand.logoUrl} size={32} />
                    <span className="truncate">{brand.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <SuggestedBrands brands={state.suggested} heading={t('suggested')} compact />
        </aside>
      </div>
    );
  }

  return (
    <section aria-labelledby="following-heading">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-grey pb-6">
        <div>
          <h1
            id="following-heading"
            className="text-3xl font-semibold tracking-tight text-ink-black"
          >
            {tNav('following')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-nike-grey">{t('feedHint')}</p>
        </div>
        {(state.status === 'ready' || state.status === 'empty') && (
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full border border-stone-grey bg-white px-4 py-2.5 text-sm font-medium text-ink-black transition hover:border-maaroud-blue hover:text-maaroud-blue"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.4 7a8 8 0 0 1 13-1L20 9M4 15l1.6 3a8 8 0 0 0 13-1" />
            </svg>
            {t('refresh')}
          </button>
        )}
      </div>
      {body}
    </section>
  );
}

function SuggestedBrands({
  brands,
  heading,
  compact = false,
}: {
  brands: BrandSummary[];
  heading: string;
  compact?: boolean;
}) {
  const tNav = useTranslations('Nav');
  if (brands.length === 0) return null;
  return (
    <section className="rounded-2xl border border-stone-grey bg-white p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-black">{heading}</h2>
        <Link
          href={{ pathname: '/brands' }}
          className="text-xs font-medium text-maaroud-blue hover:underline"
        >
          {tNav('brands')}
        </Link>
      </div>
      <ul className={compact ? 'flex flex-col gap-4' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
        {brands.slice(0, compact ? 5 : 8).map((brand) => (
          <li key={brand.id} className="flex min-w-0 items-center justify-between gap-2">
            <Link
              href={{ pathname: '/brands/[slug]', params: { slug: brand.slug } }}
              className="flex min-w-0 items-center gap-3"
            >
              <BrandAvatar name={brand.name} logoUrl={brand.logoUrl} size={36} />
              <span className="truncate text-sm font-medium text-ink-black hover:text-maaroud-blue">
                {brand.name}
              </span>
            </Link>
            <FollowButton merchantId={brand.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
