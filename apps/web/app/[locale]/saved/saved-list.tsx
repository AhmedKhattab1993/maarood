"use client";

import { useEffect, useState } from "react";
import { listSaved } from "@/lib/saved";
import { getDeviceId } from "@/lib/device-id";
import { ApiError, type SavedProduct } from "@/lib/api/types";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid";
import { EmptyState } from "@/components/state-views";
import { Link } from "@/i18n/navigation";

/**
 * Client-side saved list. Saved products are keyed to an anonymous device id
 * (localStorage), so this page must render on the client after the id is read.
 */
export function SavedList({
  emptyTitle,
  emptyHint,
  browseLabel,
}: {
  emptyTitle: string;
  emptyHint: string;
  browseLabel: string;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "empty" }
    | { status: "ready"; items: SavedProduct[] }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Ensure a device id exists before listing.
      getDeviceId();
      try {
        const items = await listSaved();
        if (cancelled) return;
        setState(
          items.length === 0
            ? { status: "empty" }
            : { status: "ready", items },
        );
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "error";
        setState({ status: "error", message });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <ProductGridSkeleton />;
  if (state.status === "empty") {
    return (
      <EmptyState
        title={emptyTitle}
        hint={emptyHint}
        action={
          <Link
            href={{ pathname: "/" }}
            className="text-sm font-medium text-maaroud-blue hover:underline"
          >
            {browseLabel}
          </Link>
        }
      />
    );
  }
  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-stone-grey bg-white px-6 py-16 text-center text-sm text-cool-grey">
        {state.message}
      </div>
    );
  }

  return <ProductGrid products={state.items.map((s) => s.product)} />;
}
