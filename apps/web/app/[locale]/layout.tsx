import "../globals.css";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { dirFor, htmlLang, isLocale } from "@/i18n/config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";

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
    <html lang={htmlLang(locale)} dir={dirFor(locale)} suppressHydrationWarning>
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
