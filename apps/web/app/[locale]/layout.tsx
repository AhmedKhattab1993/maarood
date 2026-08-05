import "../globals.css";
import type { ReactNode } from "react";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { dirFor, htmlLang, isLocale } from "@/i18n/config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";

// Arabic-first pairing. Both are exposed as CSS variables that override the
// @theme fallbacks so `var(--font-sans)` / `var(--font-latin)` resolve to the
// self-hosted webfonts. Inter covers Latin glyphs; IBM Plex Sans Arabic covers
// Arabic and shares Inter's neutral grotesque feel.
const latin = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Enable static rendering for this locale segment.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={htmlLang(locale)}
      dir={dirFor(locale)}
      className={`${latin.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <SiteFooter />
          <MobileTabBar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
