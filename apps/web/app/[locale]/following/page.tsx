import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FollowingFeed } from "./following-feed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: t("followingTitle") };
}

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Following" });

  return (
    <div className="mx-auto max-w-[var(--container-max)] px-4 py-6 md:px-8 md:py-8">
      <FollowingFeed
        emptyTitle={t("empty")}
        emptyHint={t("emptyHint")}
        loginHint={t("loginHint")}
        browseLabel={t("browse")}
      />
    </div>
  );
}
