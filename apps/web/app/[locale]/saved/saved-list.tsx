"use client";

import { useEffect, useState } from "react";
import { listSaved } from "@/lib/saved";
import { getAuthToken } from "@/lib/auth";
import { publicBackendUrl } from "@/lib/api/backend-url";
import { ApiError, type BrandSummary, type SavedProduct } from "@/lib/api/types";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid";
import { EmptyState } from "@/components/state-views";
import { Link } from "@/i18n/navigation";

/**
 * Client-side saved list. Saved products are keyed to the signed-in user's
 * bearer token, so this page renders on the client after the token is read.
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
    | { status: "anon" }
    | { status: "empty" }
    | { status: "ready"; items: SavedProduct[]; brands: BrandSummary[] }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!getAuthToken()) {
        if (!cancelled) setState({ status: "anon" });
        return;
      }
      try {
        const [items, brands] = await Promise.all([
          listSaved(),
          loadBrands(),
        ]);
        if (cancelled) return;
        setState(
          items.length === 0
            ? { status: "empty" }
            : { status: "ready", items, brands },
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

  if (state.status === "loading") return <ProductGridSkeleton layout="grid" />;
  if (state.status === "anon") {
    return (
      <EmptyState
        title={emptyTitle}
        hint={emptyHint}
        action={
          <Link
            href={{ pathname: "/login" }}
            className="text-sm font-medium text-maaroud-blue hover:underline"
          >
            {browseLabel}
          </Link>
        }
      />
    );
  }
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
      <div className="rounded-lg border border-stone-grey bg-white px-6 py-16 text-center text-sm text-nike-grey">
        {state.message}
      </div>
    );
  }

  return (
    <ProductGrid
      layout="grid"
      products={state.items.map((s) => s.product)}
      brands={state.brands}
      allSaved
      onUnsaved={(productId) =>
        setState((s) =>
          s.status === "ready"
            ? {
                ...s,
                items: s.items.filter((item) => item.product.id !== productId),
              }
            : s,
        )
      }
    />
  );
}

async function loadBrands(): Promise<BrandSummary[]> {
  try {
    const res = await fetch(`${publicBackendUrl()}/v1/brands`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    return (await res.json()) as BrandSummary[];
  } catch {
    return [];
  }
}
