import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getProduct, getBrands, getProducts } from '@/lib/api/client';
import { NotFoundError, ApiError, type PublicProduct } from '@/lib/api/types';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SaveButton } from '@/components/save-button';
import { ViewAtBrand } from '@/components/view-at-brand';
import { ProductGrid } from '@/components/product-grid';
import { ErrorState } from '@/components/state-views';
import { ProductPrice } from '@/components/product-price';
import { ProductGallery } from '@/components/product-gallery';
import { ProductOptions } from '@/components/product-options';
import { ProductInterest } from '@/components/product-interest';
import { BrandAvatar } from '@/components/brand-avatar';
import { FollowButton } from '@/components/follow-button';
import { Link } from '@/i18n/navigation';
import { ProductJsonLd } from './product-jsonld';
import { gallerySrcs } from '@/lib/product-image';
import { priceDiscount } from '@/lib/price-display';
import { displayAvailability } from '@/lib/availability';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  try {
    const product = await getProduct(id);
    const images = product.imageUrls.slice(0, 5);
    return {
      title: product.title,
      description: product.description || undefined,
      openGraph: { images },
    };
  } catch (err) {
    // Metadata resolves before streaming, so a 404 here carries the status.
    // A malformed id (API 400) can never resolve to a product — same treatment.
    if (err instanceof NotFoundError) notFound();
    if (err instanceof ApiError && err.status === 400) notFound();
    const t = await getTranslations({ locale, namespace: 'Product' });
    return { title: t('notFound') };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  let product: PublicProduct;
  try {
    product = await getProduct(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    // Malformed ids can never resolve to a product — treat as not found too.
    if (err instanceof ApiError && err.status === 400) notFound();
    return (
      <div className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <ErrorState error={err} />
      </div>
    );
  }

  const brand = (await getBrands().catch(() => [])).find((b) => b.id === product.merchantId);
  const brandName = brand?.name ?? '';
  // vendor = the manufacturer/brand reported by the source (distinct from the
  // store). Prefer it for SEO structured-data brand when present.
  const vendorName = product.vendor || brandName;
  const discount = priceDiscount(product.currentPrice, product.previousPrice);
  // Product-level "unknown" often has a real signal in variant stock data.
  const availability = displayAvailability(product);

  let alternatives: PublicProduct[] = [];
  if (availability === 'out_of_stock') {
    const alt = await getProducts({
      category: product.category || undefined,
      merchantId: product.merchantId,
      availability: 'in_stock',
      limit: 8,
    }).catch(() => null);
    alternatives = (alt?.items ?? []).filter((p) => p.id !== product.id);
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 pb-36 pt-6 sm:px-6 md:py-10 lg:px-8">
      <ProductInterest product={product} />
      <Breadcrumbs
        items={[
          { label: t('Nav.home'), href: { pathname: '/' } },
          ...(brand
            ? [
                {
                  label: brand.name,
                  href: {
                    pathname: '/brands/[slug]',
                    params: { slug: brand.slug },
                  } as const,
                },
              ]
            : []),
          { label: product.title },
        ]}
      />

      <ProductJsonLd product={product} brandName={vendorName} />

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
        <ProductGallery imageUrls={gallerySrcs(product.imageUrls)} title={product.title} />

        <div className="flex min-w-0 flex-col gap-5 py-2">
          {brand && (
            <div className="mb-1 flex items-center justify-between gap-3 border-b border-stone-grey pb-5">
              <Link
                href={{ pathname: '/brands/[slug]', params: { slug: brand.slug } }}
                className="flex min-w-0 items-center gap-3 rounded-default"
              >
                <BrandAvatar name={brand.name} logoUrl={brand.logoUrl} size={44} />
                <span className="truncate text-sm font-semibold hover:text-maaroud-blue">
                  {brand.name}
                </span>
              </Link>
              <FollowButton merchantId={product.merchantId} />
            </div>
          )}
          {vendorName && vendorName !== brandName && (
            <span className="text-sm font-medium text-nike-grey">{vendorName}</span>
          )}
          <h1 className="text-2xl font-semibold leading-snug tracking-tight text-ink-black lg:text-3xl">
            {product.title}
          </h1>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="text-2xl font-semibold text-ink-black">
              <ProductPrice amount={product.currentPrice} currency={product.currency} />
            </span>
            {discount.show && product.previousPrice !== null && (
              <>
                <span className="text-base text-nike-grey line-through">
                  <ProductPrice amount={product.previousPrice} currency={product.currency} />
                </span>
                <span className="rounded-pill bg-alert-red/5 px-2.5 py-1 text-sm font-medium text-alert-red">
                  {t('Product.onSale', { percent: discount.percent })}
                </span>
              </>
            )}
          </div>

          {availability === 'in_stock' && (
            <p className="flex items-center gap-2 text-sm font-medium text-success-green">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success-green" />
              {t('Product.inStock')}
            </p>
          )}
          {availability === 'out_of_stock' && (
            <p className="text-sm font-medium text-alert-red">{t('Product.outOfStock')}</p>
          )}
          {availability === 'unknown' && (
            <p className="text-sm font-medium text-nike-grey">
              {t('Product.availabilityUnconfirmed')}
            </p>
          )}
          {product.stale && <p className="text-sm text-nike-grey">{t('Product.stale')}</p>}

          <ProductOptions
            sizes={product.sizes}
            colors={product.colors}
            options={product.options}
            variants={product.variants}
            sizeLabel={t('Product.optionSize')}
            colorLabel={t('Product.optionColor')}
          />

          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-stone-grey bg-white/95 px-4 py-3 backdrop-blur-xl md:static md:inset-auto md:z-auto md:mt-2 md:border-0 md:bg-transparent md:p-0">
            <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-3 md:mx-0">
              <ViewAtBrand
                productId={product.id}
                redirectUrl={product.redirectUrl}
                brandName={brandName || vendorName}
              />
              <SaveButton productId={product.id} variant="label" />
            </div>
          </div>

          <div className="rounded-lg border border-stone-grey/70 bg-surface/70 px-4 py-3 text-xs leading-relaxed text-nike-grey">
            {brandName && (
              <p className="font-medium text-ink-black">
                {t('Product.checkoutAt', { brand: brandName })}
              </p>
            )}
            {(product.sizes.length > 0 || product.colors.length > 0) && (
              <p className="mt-1">{t('Product.optionsHint')}</p>
            )}
            {!brandName && <p>{t('Footer.redirectNote')}</p>}
          </div>

          {product.description && (
            <details open className="border-y border-stone-grey py-4">
              <summary className="cursor-pointer text-sm font-semibold text-ink-black">
                {t('Product.details')}
              </summary>
              <p className="mt-4 max-w-prose whitespace-pre-line break-words text-sm leading-relaxed text-nike-grey">
                {product.description}
              </p>
            </details>
          )}
        </div>
      </div>

      {alternatives.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-ink-black">{t('Product.alternatives')}</h2>
          <ProductGrid
            products={alternatives}
            brands={
              brand
                ? [
                    {
                      id: brand.id,
                      name: brand.name,
                      slug: brand.slug,
                      domain: brand.domain,
                      productCount: 0,
                      logoUrl: brand.logoUrl,
                    },
                  ]
                : []
            }
          />
        </section>
      )}
    </div>
  );
}
