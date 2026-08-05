import type { ReactNode } from "react";

/**
 * Root layout — minimal. The locale is always URL-prefixed (middleware), so the
 * real <html>/<body> lives in app/[locale]/layout.tsx. This file exists only to
 * satisfy Next.js's requirement of a root layout.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
