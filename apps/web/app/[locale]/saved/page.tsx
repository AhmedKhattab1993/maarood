import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SavedList } from "./saved-list";
import { Breadcrumbs } from "@/components/breadcrumbs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("savedTitle") };
}

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:py-10">
      <Breadcrumbs
        items={[
          { label: t("Nav.home"), href: { pathname: "/" } },
          { label: t("Nav.saved") },
        ]}
      />
      <h1 className="mb-6 mt-2 text-2xl font-semibold text-ink-black md:text-3xl">
        {t("Saved.title")}
      </h1>
      <SavedList emptyTitle={t("Saved.empty")} emptyHint={t("Saved.emptyHint")} browseLabel={t("Saved.browse")} />
    </div>
  );
}
