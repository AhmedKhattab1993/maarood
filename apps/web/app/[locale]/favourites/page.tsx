import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SavedList } from "../saved/saved-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("favouritesTitle") };
}

export default async function FavouritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Favourites" });

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:px-8 md:py-8">
      <SavedList emptyTitle={t("empty")} emptyHint={t("emptyHint")} browseLabel={t("browse")} />
    </div>
  );
}
