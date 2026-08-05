import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Maaroud wordmark. Primary Arabic per 03_VISUAL_IDENTITY.md ("Arabic-first
 * hierarchy"). The Arabic wordmark معروض carries the brand identity; the Latin
 * "MAAROUD" is secondary. A Warm Sand dot at the lower-right echoes the
 * locked symbol direction (open display frame + product dot).
 *
 * Server component — uses getTranslations (not the useTranslations hook) so the
 * message resolves reliably during static prerender, where the hook's request
 * context can be absent during RSC serialization.
 */
export async function Logo({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("Brand");
  return (
    <Link
      href={{ pathname: "/" }}
      className="inline-flex items-baseline gap-1.5 font-semibold tracking-tight text-ink-black"
      aria-label={t("name")}
    >
      <span className="text-xl md:text-2xl" lang="ar">
        معروض
      </span>
      {!compact && (
        <span
          className="text-[0.625rem] uppercase tracking-[0.2em] text-cool-grey"
          style={{ fontFamily: "var(--font-latin)" }}
        >
          Maaroud
        </span>
      )}
      {/* Warm Sand product dot — locked symbol accent (03:43-47). */}
      <span
        aria-hidden
        className="ms-0.5 inline-block h-1.5 w-1.5 translate-y-1 rounded-full bg-warm-sand"
      />
    </Link>
  );
}
