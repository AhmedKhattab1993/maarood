"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { followBrand, getAuthToken, listFollowing, unfollowBrand } from "@/lib/auth";
import { followIntent } from "@/lib/follow-intent";
import { ApiError } from "@/lib/api/types";

export function FollowButton({ merchantId }: { merchantId: string }) {
  const t = useTranslations("Follow");
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!getAuthToken()) {
      setReady(true);
      return;
    }
    void listFollowing()
      .then((items) => setFollowing(items.some((i) => i.merchantId === merchantId)))
      .finally(() => setReady(true));
  }, [merchantId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const intent = followIntent(Boolean(getAuthToken()), following);
    if (intent === "login") {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      try {
        if (intent === "unfollow") {
          await unfollowBrand(merchantId);
          setFollowing(false);
        } else {
          await followBrand(merchantId);
          setFollowing(true);
        }
      } catch (err) {
        console.warn("follow toggle failed", err instanceof ApiError ? err.message : err);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending || !ready}
      className="rounded-default border border-stone-grey bg-white px-3 py-1.5 text-xs font-medium text-ink-black hover:bg-stone-grey disabled:opacity-50"
    >
      {following ? t("unfollow") : t("follow")}
    </button>
  );
}
