'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/format';
import { coverSrc } from '@/lib/product-image';
import { priceDiscount } from '@/lib/price-display';
import type { BrandSummary, PublicProduct } from '@/lib/api/types';
import type { ProductLayout } from './product-feed-layout';
import { SaveButton } from './save-button';
import { FollowButton } from './follow-button';
import { BrandAvatar } from './brand-avatar';

interface ProductCardProps {
  product: PublicProduct;
  /** Brand lookup so the post can show the merchant as the author. */
  brands?: BrandSummary[];
  /** Priority loading for above-the-fold cards. */
  priority?: boolean;
  /** Favourites already know this row is saved; skip a flash of the inactive state. */
  initialSaved?: boolean;
  /** Called after the save state changes (unsave removes the row on /favourites). */
  onUnsaved?: (productId: string) => void;
  /** Hide the author row (brand page already owns the brand identity). */
  hideAuthor?: boolean;
  /** Feed keeps the brand header. Grid is the catalog tile. */
  layout?: ProductLayout;
}

/**
 * Catalog tile or Following post. The photo opens the product. Saving sits
 * on the photo. Buying happens on the product page, not on the card.
 */
export function ProductCard({ layout = 'grid', ...props }: ProductCardProps) {
  if (layout === 'feed') return <FeedPost {...props} />;
  return <GridCard {...props} />;
}

function GridCard({
  product,
  brands,
  priority,
  initialSaved = false,
  onUnsaved,
  hideAuthor = false,
}: Omit<ProductCardProps, 'layout'>) {
  const brand = brands?.find((item) => item.id === product.merchantId);
  const brandName = brand?.name || product.vendor || '';

  return (
    <article className="group flex h-full w-full flex-col">
      <div className="relative">
        <Link
          href={{ pathname: '/p/[id]', params: { id: product.id } }}
          className="block rounded-lg focus-visible:outline-offset-4"
        >
          <Cover product={product} priority={priority} />
        </Link>
        <div className="absolute end-2 top-2 z-10">
          <SaveButton
            productId={product.id}
            initialSaved={initialSaved}
            onSavedChange={(id, saved) => {
              if (!saved) onUnsaved?.(id);
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1.5 px-0.5">
        {!hideAuthor && brand && (
          <Link
            href={{ pathname: '/brands/[slug]', params: { slug: brand.slug } }}
            className="w-fit max-w-full truncate text-xs font-medium text-nike-grey transition-colors hover:text-maaroud-blue"
          >
            {brand.name}
          </Link>
        )}
        {!hideAuthor && !brand && brandName && (
          <p className="truncate text-xs font-medium text-nike-grey">{brandName}</p>
        )}
        <Link
          href={{ pathname: '/p/[id]', params: { id: product.id } }}
          className="flex flex-1 flex-col gap-2"
        >
          <h3 className="line-clamp-2 text-sm font-medium leading-relaxed text-ink-black transition-colors group-hover:text-maaroud-blue">
            {product.title}
          </h3>
          <Price product={product} />
        </Link>
      </div>
    </article>
  );
}

function FeedPost({
  product,
  brands,
  priority,
  initialSaved = false,
  onUnsaved,
  hideAuthor = false,
}: Omit<ProductCardProps, 'layout'>) {
  const brand = brands?.find((item) => item.id === product.merchantId);

  return (
    <article className="group flex w-full flex-col rounded-xl border border-stone-grey/70 bg-white p-3 shadow-[0_4px_24px_-16px_#17255430] sm:p-4">
      {!hideAuthor && (
        <header className="mb-4 flex flex-nowrap items-center justify-between gap-3">
          {brand ? (
            <Link
              href={{ pathname: '/brands/[slug]', params: { slug: brand.slug } }}
              className="flex min-h-11 min-w-0 items-center gap-3 rounded-default"
            >
              <BrandAvatar name={brand.name} logoUrl={brand.logoUrl} size={40} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-ink-black">{brand.name}</span>
                <span className="truncate text-xs text-nike-grey" dir="ltr">
                  {`@${brand.slug}`}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          <FollowButton merchantId={product.merchantId} />
        </header>
      )}
      <div className="relative">
        <Link
          href={{ pathname: '/p/[id]', params: { id: product.id } }}
          className="flex w-full flex-col"
        >
          <Cover product={product} priority={priority} />
          <div className="mt-3 flex flex-col gap-2 px-1 pb-1">
            <h3 className="line-clamp-2 text-base font-medium leading-relaxed text-ink-black">
              {product.title}
            </h3>
            <Price product={product} />
          </div>
        </Link>
        <div className="absolute end-2 top-2 z-10">
          <SaveButton
            productId={product.id}
            initialSaved={initialSaved}
            onSavedChange={(id, saved) => {
              if (!saved) onUnsaved?.(id);
            }}
          />
        </div>
      </div>
    </article>
  );
}

function Cover({ product, priority }: { product: PublicProduct; priority?: boolean }) {
  const t = useTranslations('Product');
  const cover = coverSrc(product.imageUrls);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface">
      {cover && failedSrc !== cover && loadedSrc !== cover && (
        <div aria-hidden="true" className="maarood-skeleton absolute inset-0" />
      )}
      {cover && failedSrc !== cover ? (
        // Plain <img> to the merchant CDN — Next's optimizer 400s on
        // arbitrary Shopify/Woo hosts (`/_next/image?url=...`).
        <img
          src={cover}
          alt={product.title}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(cover)}
          onLoad={() => setLoadedSrc(cover)}
          className="relative h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.035]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-nike-grey">
          <PlaceholderIcon />
        </div>
      )}
      <div className="absolute start-2 top-2 flex max-w-[65%] flex-col items-start gap-1">
        {product.availability === 'out_of_stock' && <Badge tone="muted">{t('outOfStock')}</Badge>}
        {product.stale && <Badge tone="alert">{t('stale')}</Badge>}
      </div>
    </div>
  );
}

function Price({ product }: { product: PublicProduct }) {
  const locale = useLocale();
  const discount = priceDiscount(product.currentPrice, product.previousPrice);
  return (
    <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-sm font-semibold text-ink-black">
        {formatPrice(product.currentPrice, product.currency, locale)}
      </span>
      {discount.show && product.previousPrice !== null && (
        <>
          <span className="text-xs text-nike-grey line-through">
            {formatPrice(product.previousPrice, product.currency, locale)}
          </span>
          <span className="rounded-sm bg-alert-red/5 px-1 text-xs font-medium text-alert-red">
            -{discount.percent}%
          </span>
        </>
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: 'muted' | 'alert'; children: React.ReactNode }) {
  const cls = tone === 'alert' ? 'bg-white/95 text-nike-grey' : 'bg-ink-black/85 text-white';
  return (
    <span
      className={`rounded-sm px-2 py-1 text-2xs font-medium leading-normal backdrop-blur-sm ${cls}`}
    >
      {children}
    </span>
  );
}

function PlaceholderIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
