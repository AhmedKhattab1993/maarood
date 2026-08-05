import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/api/types";

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stone-grey px-6 py-16 text-center">
      <p className="text-base font-medium text-ink-black">{title}</p>
      {hint && <p className="max-w-sm text-sm text-cool-grey">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const t = useTranslations("State");
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? t("error")
        : t("error");
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-stone-grey bg-white px-6 py-16 text-center">
      <p className="text-base font-medium text-alert-red">{t("error")}</p>
      <p className="max-w-sm text-sm text-cool-grey">{message}</p>
    </div>
  );
}
