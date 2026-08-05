import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-stone-grey bg-white">
      <div className="mx-auto flex max-w-[var(--container-max)] flex-col gap-2 px-4 py-8 text-sm text-cool-grey md:flex-row md:items-center md:justify-between">
        <p className="max-w-prose">{t("about")}</p>
        <p>{t("rights", { year })}</p>
      </div>
    </footer>
  );
}
