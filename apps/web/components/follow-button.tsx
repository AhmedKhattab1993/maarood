'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { followBrand, getAuthToken, listFollowing, unfollowBrand } from '@/lib/auth';
import { followIntent, toggleVisual } from '@/lib/follow-intent';
import { currentReturnTo, stash } from '@/lib/pending-action';
import { ApiError } from '@/lib/api/types';

export function FollowButton({ merchantId }: { merchantId: string }) {
  const t = useTranslations('Follow');
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const visual = toggleVisual(following, pending, failed);

  useEffect(() => {
    if (!getAuthToken()) {
      setReady(true);
      return;
    }
    void listFollowing()
      .then((items) => setFollowing(items.some((i) => i.merchantId === merchantId)))
      .catch(() => setFailed(true))
      .finally(() => setReady(true));
  }, [merchantId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const intent = followIntent(Boolean(getAuthToken()), following);
    if (intent === 'login') {
      stash({ type: 'follow', merchantId, returnTo: currentReturnTo() });
      router.push('/login');
      return;
    }
    setFailed(false);
    startTransition(async () => {
      try {
        if (intent === 'unfollow') {
          await unfollowBrand(merchantId);
          setFollowing(false);
        } else {
          await followBrand(merchantId);
          setFollowing(true);
        }
      } catch (err) {
        setFailed(true);
        console.warn('follow toggle failed', err instanceof ApiError ? err.message : err);
      }
    });
  }

  const visualClass =
    visual === 'active'
      ? 'border-ink-black bg-ink-black text-white'
      : visual === 'failed'
        ? 'border-alert-red bg-white text-alert-red'
        : 'border-stone-grey bg-white text-ink-black hover:bg-stone-grey';

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={toggle}
        disabled={pending || !ready}
        aria-pressed={following}
        aria-busy={pending || undefined}
        aria-label={
          visual === 'pending'
            ? t('pending')
            : visual === 'failed'
              ? t('failed')
              : following
                ? t('unfollow')
                : t('follow')
        }
        className={`min-h-11 rounded-default border px-3 py-2 text-xs font-medium disabled:opacity-50 ${visualClass}`}
      >
        {visual === 'pending' ? t('pending') : following ? t('unfollow') : t('follow')}
      </button>
      {visual === 'failed' && (
        <span role="alert" aria-live="polite" className="text-[0.625rem] text-alert-red">
          {t('failed')}
        </span>
      )}
    </span>
  );
}
