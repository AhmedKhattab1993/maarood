'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/types';

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-stone-grey/80 bg-white px-6 py-16 text-center">
      <span
        className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-blue-soft text-maaroud-blue"
        aria-hidden="true"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 8h16l-1 12H5L4 8Z" strokeLinejoin="round" />
          <path d="M8 8V6a4 4 0 0 1 8 0v2" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-lg font-semibold text-ink-black">{title}</p>
      {hint && <p className="max-w-sm text-sm leading-relaxed text-nike-grey">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const t = useTranslations('State');
  const router = useRouter();
  const message =
    error instanceof ApiError ? error.message : error instanceof Error ? t('error') : t('error');
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-stone-grey bg-white px-6 py-16 text-center"
    >
      <p className="text-base font-medium text-alert-red">{t('error')}</p>
      <p className="max-w-sm text-sm text-nike-grey">{message}</p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-2 min-h-11 rounded-pill bg-maaroud-blue px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-maaroud-blue-dark"
      >
        {t('retry')}
      </button>
    </div>
  );
}
