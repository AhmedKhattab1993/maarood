import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("State");
  return (
    <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-ink-black">404</h1>
      <p className="text-sm text-cool-grey">{t("empty")}</p>
      <Link
        href={{ pathname: "/" }}
        className="text-sm font-medium text-maaroud-blue hover:underline"
      >
        ← {t("retry")}
      </Link>
    </div>
  );
}
