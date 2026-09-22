import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Help' });
  return { title: t('title') };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Help' });
  const tNav = await getTranslations({ locale, namespace: 'Nav' });
  const tFooter = await getTranslations({ locale, namespace: 'Footer' });

  return (
    <div className="mx-auto max-w-[var(--container-prose)] px-4 py-8 md:py-12">
      <div className="mb-8 rounded-3xl bg-warm-ivory p-6 md:p-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-maaroud-blue">
          {tFooter('company')}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-black md:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-nike-grey">{t('maaroud')}</p>
      </div>
      <section className="rounded-2xl border border-stone-grey bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-ink-black">
          {tFooter('shipping')} &amp; {tFooter('returns')}
        </h2>
        <p className="text-sm leading-relaxed text-nike-grey md:text-base">{t('brandOrders')}</p>
        <Link
          href={{ pathname: '/brands' }}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-maaroud-blue hover:underline"
        >
          {tNav('brands')}{' '}
          <span aria-hidden className="rtl:rotate-180">
            ↗
          </span>
        </Link>
      </section>
      <section id="contact" className="mt-4 rounded-2xl border border-stone-grey bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-ink-black">{t('contactTitle')}</h2>
        <p className="text-sm leading-relaxed text-ink-black md:text-base">{t('contactBody')}</p>
      </section>

      <p className="mt-8">
        <Link
          href={{ pathname: '/' }}
          className="inline-flex rounded-full bg-maaroud-blue px-5 py-3 text-sm font-medium text-white transition hover:bg-maaroud-blue-dark"
        >
          {tNav('explore')}
        </Link>
      </p>
    </div>
  );
}
