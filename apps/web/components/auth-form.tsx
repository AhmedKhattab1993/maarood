'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { followBrand, login, signup } from '@/lib/auth';
import { saveProduct } from '@/lib/saved';
import { ApiError } from '@/lib/api/types';
import { peek, safeReturnTo, take } from '@/lib/pending-action';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingReturn, setPendingReturn] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const action = peek();
    setPendingReturn(action?.returnTo ?? null);
  }, []);

  function go(path: string | null) {
    // Always a full page load: AuthLink re-fetches the session on mount, so
    // the header reflects the signed-in state on the landing page itself.
    const dest = path ? safeReturnTo(path) : null;
    window.location.assign(dest ?? `/${locale}`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === 'signup') await signup(email, password);
      else await login(email, password);
      const action = take();
      if (action) {
        try {
          if (action.type === 'follow') await followBrand(action.merchantId);
          else await saveProduct(action.productId);
        } catch {
          // Logged in; the toggle can be retried on return.
        }
        go(action.returnTo);
        return;
      }
      go(null);
    } catch (err) {
      // Backend messages are English constants; show localized copy instead.
      if (err instanceof ApiError && err.status === 401) setError(t('invalidCredentials'));
      else if (err instanceof ApiError && err.status === 409) setError(t('emailTaken'));
      else setError(t('error'));
    } finally {
      setPending(false);
    }
  }

  function onCancel() {
    const action = take();
    go(action?.returnTo ?? pendingReturn);
  }

  return (
    <div className="mx-auto my-8 max-w-md px-4 sm:my-16">
      <div className="rounded-2xl border border-stone-grey/80 bg-white p-6 shadow-[0_12px_48px_-24px_#17255440] sm:p-8">
        <span
          aria-hidden="true"
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft text-maaroud-blue"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-black">
          {mode === 'signup' ? t('signup') : t('login')}
        </h1>
        <p className="mb-7 mt-3 text-sm leading-relaxed text-nike-grey">
          {mode === 'signup' ? t('signupHint') : t('loginHint')}
        </p>
        <form onSubmit={onSubmit} aria-busy={pending} className="flex flex-col gap-5">
          <label className="text-sm font-medium text-ink-black">
            {t('email')}
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 w-full rounded-default border border-stone-grey bg-surface/60 px-3 text-base font-normal transition-colors focus:border-maaroud-blue focus:bg-white"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              dir="ltr"
            />
          </label>
          <div>
            <label htmlFor="auth-password" className="text-sm font-medium text-ink-black">
              {t('password')}
            </label>
            <div className="relative mt-2">
              <input
                id="auth-password"
                name="password"
                type={passwordVisible ? 'text' : 'password'}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-default border border-stone-grey bg-surface/60 px-3 pe-12 text-base transition-colors focus:border-maaroud-blue focus:bg-white"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                aria-describedby={mode === 'signup' ? 'password-hint' : undefined}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                aria-label={passwordVisible ? t('hidePassword') : t('showPassword')}
                aria-pressed={passwordVisible}
                className="absolute end-1 top-1 flex h-10 w-10 items-center justify-center rounded-sm text-nike-grey hover:text-maaroud-blue"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" />
                  {passwordVisible && <path d="m3 3 18 18" strokeLinecap="round" />}
                </svg>
              </button>
            </div>
            {mode === 'signup' && (
              <p id="password-hint" className="mt-2 text-xs text-nike-grey">
                {t('passwordHint')}
              </p>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-default bg-alert-red/5 px-3 py-3 text-sm text-alert-red"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 min-h-12 rounded-default bg-maaroud-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-maaroud-blue-dark disabled:opacity-50"
          >
            {pending ? t('pending') : mode === 'signup' ? t('signup') : t('login')}
          </button>
          {pendingReturn && (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="min-h-11 rounded-default border border-stone-grey bg-white px-4 py-2 text-sm text-ink-black hover:bg-surface disabled:opacity-50"
            >
              {t('cancel')}
            </button>
          )}
        </form>
        <p className="mt-6 border-t border-stone-grey pt-5 text-center text-sm text-nike-grey">
          {mode === 'signup' ? (
            <Link href={{ pathname: '/login' }} className="text-maaroud-blue hover:underline">
              {t('haveAccount')}
            </Link>
          ) : (
            <Link href={{ pathname: '/signup' }} className="text-maaroud-blue hover:underline">
              {t('needAccount')}
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
