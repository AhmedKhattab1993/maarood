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
Catalog discovery and outbound-click redirects are public. Saving products
and following brands require an account. The backend records outbound clicks
on redirect (`/v1/products/:id/redirect`).

## Crawl workflow host

This project also hosts the **ingestion workflow** (`workflows/crawl.ts`):
Vercel Cron hits `GET /api/cron/crawl` (Bearer `CRON_SECRET`) every 6h and the
workflow runs one durable, auto-retried step per due merchant against
`DATABASE_URL` (Neon). The pipeline logic lives in `@maarood/scraper`.
Local: `npx next start` + `curl -H "Authorization: Bearer $CRON_SECRET"`
`localhost:3000/api/cron/crawl` runs it via the Local World; `npx workflow inspect runs`
shows runs. See [`deploy/README.md`](../../deploy/README.md).

## Routes

| Route | Page |
|---|---|
| `/[locale]` | Home / discovery |
| `/[locale]/search` | Search results |
| `/[locale]/c/[category]` | Category listing |
| `/[locale]/brands` | Brand index |
| `/[locale]/brands/[slug]` | Brand page |
| `/[locale]/p/[id]` | Product detail |
| `/[locale]/saved` | Saved products |
| `/[locale]/favourites` | Account favourites |
| `/[locale]/following` | Followed brands and their products |
| `/[locale]/login`, `/[locale]/signup` | Account access |
| `/[locale]/help` | Shopping and checkout help |

All listing/search/category/brand pages are server-rendered with per-page
`generateMetadata` and JSON-LD `Product` schema on product detail.

## Discovery and browsing

The home page defaults to **For you**. It requests a private ranking from
`POST /v1/feed` on each visit. Opening product details teaches category and
brand preferences; visible feed cards become recent impressions so fresh
visits and **Fresh picks** can move unseen products to the top. Signed-in
accounts also use saved products and followed brands. A bounded, seeded mix
keeps room for discovery and prevents one brand from filling the page.

Browsing history stays in localStorage, separated by account (or guest).
Interests decay and expire after 30 days; recent impressions expire after
7 days and are capped at 300 products. This browsing history does not sync
across devices. Saved products and follows remain account-backed.

The seed, preference snapshot, and recent impressions stay fixed while loading
more products. A refresh starts a new ranking; the page does not reorder itself
while someone is scrolling. Explicit newest/price sorts use ordinary catalog
ordering. API failures retain the existing feed and expose a retry.

Desktop catalog pages keep categories and filters in a sticky side rail.
Mobile refinements use a keyboard-accessible modal drawer: Apply commits all
edits together, while closing cancels the draft. Search supports keyboard
suggestions, recent queries, Arabic/English shopping terms, and brand intent.

## Out of scope (deferred)

Nike-style guided finder, collections (no backend entity), native mobile app.
