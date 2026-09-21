# @maarood/web

Maarood web frontend — Next.js (App Router), Arabic-first, search-led product
discovery for Egyptian brands. Consumes the `@maarood/backend` public `/v1` API.

## Stack

- **Next.js 14** App Router (server components + SSR for SEO)
- **Tailwind v4** via `@theme`, tokens sourced from `@maarood/tokens`
- **next-intl** with locale-prefixed routing (`/ar`, `/en`; `ar` is default)
- **RTL** by default (Arabic); English renders LTR
- **Accounts** — saved products and followed brands are keyed to a signed-in
  user (bearer token in localStorage)

## Typography

Arabic-first pairing: **IBM Plex Sans Arabic** (Arabic) + **Inter** (Latin). Both
open-source and editorial-neutral, matching the SSENSE/Aritzia restraint.
Load them via your font provider of choice
or self-host; the CSS references them by name and falls back to `system-ui`.
Swap is trivial — change `--font-sans` in `app/globals.css`.

## Known upstream limitation: notFound() pages return HTTP 200

The async locale layout streams the shell (header/footer) before a page's data
resolves, so when `notFound()` fires afterwards the status is already committed
as 200. The localized 404 UI still renders (see `app/[locale]/not-found.tsx`),
and `generateMetadata` routes known-missing resources to it, but the HTTP status
for streamed 404s stays 200. This is documented Next.js 14 behavior for streamed
responses; revisiting if/when the app upgrades Next.

## Environment

Copy `.env.example` to `.env.local`:

```
BACKEND_URL=http://localhost:8080          # server-side fetch to the API
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 # client-side fetch (saved products)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # SEO canonicals / OpenGraph
```

## Develop

From the repo root:

```
npm run db:up        # postgres
npm run db:migrate   # apply schema
npm run seed         # seed merchants (nastrends, antikka)
npm run dev --workspace @maarood/backend   # API on :8080
npm run dev --workspace @maarood/web        # web on :3000
```

The web app reads products, brands, categories, and search from the backend.
Saved products and outbound-click redirects work without auth; the backend
records outbound clicks on redirect (`/v1/products/:id/redirect`).

## Crawl workflow host

This project also hosts the **ingestion workflow** (`workflows/crawl.ts`):
Vercel Cron hits `GET /api/cron/crawl` (Bearer `CRON_SECRET`) every 6h and the
workflow runs one durable, auto-retried step per due merchant against
`DATABASE_URL` (Neon). The pipeline logic lives in `@maarood/scraper`.
Local: `npx next start` + `curl -H "Authorization: Bearer $CRON_SECRET"`
`localhost:3000/api/cron/crawl` runs it via the Local World; `npx workflow inspect runs`
shows runs. See [`deploy/README.md`](../../deploy/README.md).

## Routes (the 8 locked screens — `01`/`04`/`08`)

| Route | Page |
|---|---|
| `/[locale]` | Home / discovery |
| `/[locale]/search` | Search results |
| `/[locale]/c/[category]` | Category listing |
| `/[locale]/brands` | Brand index |
| `/[locale]/brands/[slug]` | Brand page |
| `/[locale]/p/[id]` | Product detail |
| `/[locale]/saved` | Saved products |

All listing/search/category/brand pages are server-rendered with per-page
`generateMetadata` and JSON-LD `Product` schema on product detail.

## Out of scope (deferred)

Nike-style guided finder, collections (no backend entity), native mobile app.
