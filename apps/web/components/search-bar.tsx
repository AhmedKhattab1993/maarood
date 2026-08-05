"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

/** Search input that navigates to the localized /search route on submit. */
export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  return (
    <Suspense fallback={<SearchBarShell value="" onSubmit={() => {}} autoFocus={false} />}>
      <SearchBarInner autoFocus={autoFocus} />
    </Suspense>
  );
}

function SearchBarInner({ autoFocus }: { autoFocus: boolean }) {
  const t = useTranslations("Search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = pathname.includes("/search") ? searchParams.get("q") ?? "" : "";
  const [value, setValue] = useState(initial);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push({ pathname: "/search", query: { q } });
  }

  return <SearchBarShell value={value} onChange={setValue} onSubmit={onSubmit} autoFocus={autoFocus} placeholder={t("placeholder")} />;
}

function SearchBarShell({
  value,
  onChange,
  onSubmit,
  autoFocus,
  placeholder,
}: {
  value: string;
  onChange?: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  autoFocus: boolean;
  placeholder?: string;
}) {
  return (
    <form onSubmit={onSubmit} role="search" className="w-full max-w-xl">
      <input
        type="search"
        name="q"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder ?? "Search"}
        className="w-full rounded-default border border-stone-grey bg-white px-4 py-2 text-base text-ink-black outline-none transition focus:border-maaroud-blue"
      />
    </form>
  );
}
