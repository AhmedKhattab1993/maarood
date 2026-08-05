import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/** Reusable section header with optional "view all" link. */
export function SectionHeader({
  title,
  viewAllHref,
}: {
  title: string;
  viewAllHref?: Parameters<typeof Link>[0]["href"];
}) {
  const t = useTranslations("Home");
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="text-lg font-semibold text-ink-black md:text-xl">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-sm text-maaroud-blue hover:underline"
        >
          {t("viewAll")}
        </Link>
      )}
    </div>
  );
}
