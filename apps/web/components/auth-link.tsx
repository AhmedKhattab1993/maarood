"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fetchMe, logout, type AuthUser } from "@/lib/auth";

export function AuthLink() {
  const t = useTranslations("Auth");
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    void fetchMe().then(setUser);
  }, []);

  if (user === undefined) {
    return <span className="hidden h-9 w-16 md:inline" />;
  }
  if (!user) {
    return (
      <Link
        href={{ pathname: "/login" }}
        className="text-sm font-medium text-ink-black hover:text-cool-grey"
      >
        {t("login")}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        logout();
        setUser(null);
        window.location.href = "/";
      }}
      className="text-sm font-medium text-cool-grey hover:text-ink-black"
    >
      {t("logout")}
    </button>
  );
}
