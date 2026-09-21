"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getAuthToken, listFollowing } from "@/lib/auth";
import { publicGetBrands, publicGetProducts } from "@/lib/api/public-client";
import { ApiError, type PaginatedResult, type PublicProduct, type BrandSummary } from "@/lib/api/types";
import { DiscoveryFeed } from "@/components/discovery-feed";
import { ProductGridSkeleton } from "@/components/product-grid";
import { EmptyState } from "@/components/state-views";
import { FollowButton } from "@/components/follow-button";

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
  const t = useTranslations("Following");
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "anon" }
    | {
        status: "empty";
        suggested: BrandSummary[];
      }
    | {
        status: "ready";
        products: PaginatedResult<PublicProduct>;
        brands: BrandSummary[];
        suggested: BrandSummary[];
        merchantIds: string[];
      }
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
        const [followed, allBrands] = await Promise.all([
          listFollowing(),
          publicGetBrands().catch(() => [] as BrandSummary[]),
        ]);
        if (cancelled) return;
        const followedIds = new Set(followed.map((f) => f.merchantId));
        const suggested = allBrands.filter((b) => !followedIds.has(b.id));
        if (followed.length === 0) {
          setState({ status: "empty", suggested });
          return;
        }
        const merchantIds = followed.map((f) => f.merchantId);
        const page = await publicGetProducts({
          sort: "newest",
          limit: 24,
          page: 1,
          merchantId: merchantIds,
        });
        const brands: BrandSummary[] = followed.map((f) => ({
          id: f.merchantId,
          name: f.name,
          slug: f.slug,
          domain: "",
          productCount: 0,
          logoUrl: f.logoUrl,
        }));
        if (!cancelled) {
          setState({
            status: "ready",
            products: page,
            brands,
            suggested,
            merchantIds,
          });
        }
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

  if (state.status === "loading") return <ProductGridSkeleton layout="feed" />;
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
      <div className="flex flex-col gap-8">
        <EmptyState
          title={emptyTitle}
          hint={emptyHint}
          action={
            <Link href={{ pathname: "/" }} className="text-sm font-medium text-maaroud-blue hover:underline">
              {browseLabel}
            </Link>
          }
        />
        <SuggestedBrands brands={state.suggested} heading={t("suggested")} />
      </div>
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
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-4 text-lg font-medium text-ink-black">{t("yourBrands")}</h2>
        {state.products.items.length === 0 ? (
          <EmptyState title={emptyTitle} hint={emptyHint} />
        ) : (
          <DiscoveryFeed
            layout="feed"
            initial={state.products}
            brands={state.brands}
            source={{
              kind: "products",
              query: {
                sort: "newest",
                limit: 24,
                merchantId: state.merchantIds,
              },
            }}
          />
        )}
      </section>
      <SuggestedBrands brands={state.suggested} heading={t("suggested")} />
    </div>
  );
}

function SuggestedBrands({
  brands,
  heading,
}: {
  brands: BrandSummary[];
  heading: string;
}) {
  if (brands.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 text-lg font-medium text-ink-black">{heading}</h2>
      <ul className="flex flex-col gap-3">
        {brands.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3">
            <Link
              href={{ pathname: "/brands/[slug]", params: { slug: b.slug } }}
              className="flex min-w-0 items-center gap-3"
            >
              {b.logoUrl ? (
                <img
                  src={b.logoUrl}
                  alt=""
                  width={40}
                  height={40}
                  referrerPolicy="no-referrer"
                  className="h-10 w-10 shrink-0 bg-white object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center bg-stone-grey text-sm font-semibold"
                >
                  {b.name.trim().charAt(0)}
                </span>
              )}
              <span className="truncate text-sm font-medium text-ink-black">
                {b.name}
              </span>
            </Link>
            <FollowButton merchantId={b.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
