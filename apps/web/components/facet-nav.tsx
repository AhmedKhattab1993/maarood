import { Link } from "@/i18n/navigation";

/**
 * Horizontal chip nav for the bidirectional brand↔category relationship.
 * Used on the brand page (to jump between that brand's categories) and on the
 * category page (to jump between the brands that sell in it). Selecting a chip
 * sets a single query param on the current page and reloads; the listing
 * respects that param.
 */
export interface FacetNavItem {
  label: string;
  count: number;
  /** Value to set on `paramKey` when this chip is selected. */
  value: string;
}

/** The href shape accepted by the locale-aware Link. */
type Href = Parameters<typeof Link>[0]["href"];

export function FacetNav({
  title,
  items,
  paramKey,
  activeValue,
  basePath,
  /** Current query params to preserve (already excludes `paramKey`). */
  baseQuery,
}: {
  title: string;
  items: FacetNavItem[];
  paramKey: "category" | "brand";
  activeValue?: string;
  /** Route template next-intl can interpolate [param] from (e.g. "/brands/[slug]"). */
  basePath: string;
  baseQuery?: Record<string, string | undefined>;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cool-grey">
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.value === activeValue;
          // Preserve the existing query (e.g. price filters) and set our key.
          const query: Record<string, string | undefined> = { ...baseQuery };
          if (active) delete query[paramKey];
          else query[paramKey] = item.value;
          return (
            <li key={item.value}>
              <Link
                href={{ pathname: basePath, query } as Href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-ink-black bg-ink-black text-white"
                    : "border-stone-grey bg-white text-ink-black hover:border-ink-black"
                }`}
              >
                <span className="capitalize">{item.label}</span>
                <span
                  className={`text-xs ${
                    active ? "text-white/70" : "text-cool-grey"
                  }`}
                >
                  {item.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
