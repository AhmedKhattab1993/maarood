import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Global footer — Nike-style: white, 48px padding, multi-column link grid +
 * bottom bar. Columns are adapted to Maaroud's real routes (Categories/Brands/
 * Search) plus placeholder columns (Help/Maaroud) to be wired as the product
 * grows.
 */
export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-grey bg-white">
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-2 gap-8 px-4 py-12 md:grid-cols-3 md:px-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-black">
            {t("discover")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-cool-grey">
            <li>
              <Link href={{ pathname: "/" }} className="transition-colors hover:text-ink-black">
                {tNav("explore")}
              </Link>
            </li>
            <li>
              <Link href={{ pathname: "/following" }} className="transition-colors hover:text-ink-black">
                {tNav("following")}
              </Link>
            </li>
            <li>
              <Link href={{ pathname: "/favourites" }} className="transition-colors hover:text-ink-black">
                {tNav("favourites")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Shop */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-black">
            {t("shop")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-cool-grey">
            <li>
              <Link href={{ pathname: "/search" }} className="transition-colors hover:text-ink-black">
                {tNav("search")}
              </Link>
            </li>
            <li>
              <Link href={{ pathname: "/brands" }} className="transition-colors hover:text-ink-black">
                {tNav("brands")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-black">
            {t("help")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-cool-grey">
            <li>
              <Link href={{ pathname: "/help" }} className="transition-colors hover:text-ink-black">
                {t("maaroudHelp")}
              </Link>
            </li>
            <li>
              <Link href={{ pathname: "/help" }} className="transition-colors hover:text-ink-black">
                {t("contactMaaroud")}
              </Link>
            </li>
            <li>
              <p>{t("orderHelp")}</p>
            </li>
          </ul>
        </div>

        {/* Maaroud — company pages (about/privacy/terms) don't exist yet. */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-black">
            {t("company")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-cool-grey">
            <li>
              <p>{t("redirectNote")}</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-grey">
        <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-cool-grey md:flex-row md:px-12">
          <p>{t("rights", { year })}</p>
          <p>{t("redirectNote")}</p>
        </div>
      </div>
    </footer>
  );
}
