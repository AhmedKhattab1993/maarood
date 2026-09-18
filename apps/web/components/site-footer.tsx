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
          </ul>
        </div>

        {/* Help */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-black">
            {t("help")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-cool-grey">
            <li><a href="#" className="transition-colors hover:text-ink-black">{t("shipping")}</a></li>
            <li><a href="#" className="transition-colors hover:text-ink-black">{t("returns")}</a></li>
            <li><a href="#" className="transition-colors hover:text-ink-black">{t("contact")}</a></li>
          </ul>
        </div>

        {/* Maaroud */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-black">
            {t("company")}
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-cool-grey">
            <li><a href="#" className="transition-colors hover:text-ink-black">{t("about")}</a></li>
            <li><a href="#" className="transition-colors hover:text-ink-black">{t("privacy")}</a></li>
            <li><a href="#" className="transition-colors hover:text-ink-black">{t("terms")}</a></li>
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
