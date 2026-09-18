"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { login, signup } from "@/lib/auth";
import { ApiError } from "@/lib/api/types";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") await signup(email, password);
      else await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("error"));
    } finally {
      setPending(false);
    }
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
