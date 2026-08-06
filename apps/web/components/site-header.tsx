import { getTranslations } from "next-intl/server";
import { getCategories } from "@/lib/api/client";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { SearchBar } from "./search-bar";
import { categoryName } from "@/lib/categories";

/**
 * Global top navigation — Nike-style: white bar, logo left, horizontal
 * category nav center, search + saved + language right. Categories are fetched
 * server-side (this is a server component). Mobile uses the bottom tab bar;
 * the header shows logo + search on all breakpoints.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const tCat = await getTranslations("Category");
  let categoryList: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categoryList = await getCategories();
  } catch {
    // Non-critical; nav still works without categories.
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[var(--container-max)] items-center gap-4 px-4 md:gap-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-black md:flex">
          {categoryList.map((c) => (
            <Link
              key={c.name}
              href={{ pathname: "/c/[category]", params: { category: c.name } }}
              className="transition-colors hover:text-cool-grey"
            >
              {categoryName(c.name, tCat)}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 justify-end gap-4">
          <div className="w-full max-w-xs">
            <SearchBar />
          </div>
          <Link
            href={{ pathname: "/saved" }}
            className="hidden text-ink-black transition-colors hover:text-cool-grey md:inline"
            aria-label={t("saved")}
          >
            <BookmarkIcon />
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 4h12v16l-6-4-6 4V4z" strokeLinejoin="round" />
    </svg>
  );
}
