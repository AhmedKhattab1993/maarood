import { Fragment } from "react";
import { Link } from "@/i18n/navigation";

export interface Crumb {
  label: string;
  href?: Parameters<typeof Link>[0]["href"];
}

/** Lightweight RTL-aware breadcrumb trail. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumbs" className="flex flex-wrap items-center gap-1.5 text-xs text-cool-grey">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-ink-black hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-ink-black" : ""}>{item.label}</span>
            )}
            {!last && <span aria-hidden>/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
