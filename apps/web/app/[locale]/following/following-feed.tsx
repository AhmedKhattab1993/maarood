"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getAuthToken, listFollowing } from "@/lib/auth";
import { publicBackendUrl } from "@/lib/api/backend-url";
import { ApiError, type PaginatedResult, type PublicProduct, type BrandSummary } from "@/lib/api/types";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid";
import { EmptyState } from "@/components/state-views";

export function FollowingFeed({
  emptyTitle,
  emptyHint,
  loginHint,
  browseLabel,
}: {
  emptyTitle: string;
  emptyHint: string;
  loginHint: string;
  browseLabel: string;
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "anon" }
    | { status: "empty" }
    | { status: "ready"; products: PublicProduct[]; brands: BrandSummary[] }
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
        const followed = await listFollowing();
        if (cancelled) return;
        if (followed.length === 0) {
          setState({ status: "empty" });
          return;
        }
        const ids = followed.map((f) => f.merchantId);
        const sp = new URLSearchParams({ sort: "newest", limit: "24" });
        for (const id of ids) sp.append("merchantId", id);
        const res = await fetch(`${publicBackendUrl()}/v1/products?${sp}`);
        if (!res.ok) throw new Error("products");
        const page = (await res.json()) as PaginatedResult<PublicProduct>;
        const brands: BrandSummary[] = followed.map((f) => ({
          id: f.merchantId,
          name: f.name,
          slug: f.slug,
          domain: "",
          productCount: 0,
        }));
        if (!cancelled) setState({ status: "ready", products: page.items, brands });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "error";
        setState({ status: "error", message });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <ProductGridSkeleton />;
  if (state.status === "anon") {
    return (
      <EmptyState
        title={loginHint}
        action={
          <Link href={{ pathname: "/login" }} className="text-sm font-medium text-maaroud-blue hover:underline">
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
          <Link href={{ pathname: "/" }} className="text-sm font-medium text-maaroud-blue hover:underline">
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
  if (state.products.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }
  return <ProductGrid products={state.products} brands={state.brands} />;
}
