import Link from "next/link";

/**
 * Root not-found boundary. Required (in addition to [locale]/not-found.tsx)
 * for notFound() to render with a real HTTP 404 status.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: "32rem", margin: "6rem auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>404</h1>
          <p style={{ color: "#666" }}>This page could not be found.</p>
          <Link href="/" style={{ color: "#1a53d8" }}>
            Explore Maaroud
          </Link>
        </div>
      </body>
    </html>
  );
}
