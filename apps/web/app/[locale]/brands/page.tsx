import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getBrands } from '@/lib/api/client';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ErrorState } from '@/components/state-views';
import { BrandDirectory } from './brand-directory';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return { title: t('brandsTitle') };
}

export default async function BrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  let brands: Awaited<ReturnType<typeof getBrands>>;
  try {
    brands = await getBrands();
  } catch (err) {
    return (
      <div className="mx-auto max-w-[var(--container-max)] px-4 py-10">
        <ErrorState error={err} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      <Breadcrumbs
        items={[{ label: t('Nav.home'), href: { pathname: '/' } }, { label: t('Nav.brands') }]}
      />
      <div className="mb-8 mt-4 rounded-3xl bg-warm-ivory px-6 py-8 md:px-8 md:py-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-maaroud-blue">
          {t('Nav.brands')}
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink-black md:text-4xl">
          {t('Brand.directoryTitle')}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-nike-grey">
          {t('Brand.directoryHint')}
        </p>
      </div>
      <BrandDirectory brands={brands} />
    </div>
  );
}
