import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Help" });
  return { title: t("title") };
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Help" });
  const tNav = await getTranslations({ locale, namespace: "Nav" });

  return (
    <div className="mx-auto max-w-[var(--container-prose)] px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-ink-black">{t("title")}</h1>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-ink-black md:text-base">
        <p>{t("maaroud")}</p>
        <p>{t("brandOrders")}</p>
      </div>
      <p className="mt-8">
        <Link
          href={{ pathname: "/" }}
          className="text-sm font-medium text-maaroud-blue hover:underline"
        >
          {tNav("explore")}
        </Link>
      </p>
    </div>
  );
}
