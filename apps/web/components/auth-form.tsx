"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { followBrand, login, signup } from "@/lib/auth";
import { saveProduct } from "@/lib/saved";
import { ApiError } from "@/lib/api/types";
import { peek, safeReturnTo, take } from "@/lib/pending-action";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("Auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingReturn, setPendingReturn] = useState<string | null>(null);

  useEffect(() => {
    const action = peek();
    setPendingReturn(action?.returnTo ?? null);
  }, []);

  function go(path: string | null) {
    // Always a full page load: AuthLink re-fetches the session on mount, so
    // the header reflects the signed-in state on the landing page itself.
    const dest = path ? safeReturnTo(path) : null;
    window.location.assign(dest ?? "/");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") await signup(email, password);
      else await login(email, password);
      const action = take();
      if (action) {
        try {
          if (action.type === "follow") await followBrand(action.merchantId);
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
      if (err instanceof ApiError && err.status === 401) setError(t("invalidCredentials"));
      else if (err instanceof ApiError && err.status === 409) setError(t("emailTaken"));
      else setError(t("error"));
    } finally {
      setPending(false);
    }
  }

  function onCancel() {
    const action = take();
    go(action?.returnTo ?? pendingReturn);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold text-ink-black">
        {mode === "signup" ? t("signup") : t("login")}
      </h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm text-ink-black">
          {t("email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-stone-grey px-3 py-2 text-sm"
            autoComplete="email"
          />
        </label>
        <label className="text-sm text-ink-black">
          {t("password")}
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-stone-grey px-3 py-2 text-sm"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>
        {error && <p className="text-sm text-alert-red">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 bg-ink-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {mode === "signup" ? t("signup") : t("login")}
        </button>
        {pendingReturn && (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="border border-stone-grey bg-white px-4 py-2 text-sm text-ink-black hover:bg-stone-grey disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        )}
      </form>
      <p className="mt-4 text-sm text-cool-grey">
        {mode === "signup" ? (
          <Link href={{ pathname: "/login" }} className="text-maaroud-blue hover:underline">
            {t("haveAccount")}
          </Link>
        ) : (
          <Link href={{ pathname: "/signup" }} className="text-maaroud-blue hover:underline">
            {t("needAccount")}
          </Link>
        )}
      </p>
    </div>
  );
}
