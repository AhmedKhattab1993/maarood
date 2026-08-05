# @maarood/web

Maarood web frontend — Next.js (App Router), Arabic-first, search-led product
discovery for Egyptian brands. Consumes the `@maarood/backend` public `/v1` API.

## Stack

- **Next.js 14** App Router (server components + SSR for SEO, per `06_TECHNICAL_ARCHITECTURE.md`)
- **Tailwind v4** via `@theme`, tokens sourced from `@maarood/tokens`
- **next-intl** with locale-prefixed routing (`/ar`, `/en`; `ar` is default — `03_VISUAL_IDENTITY.md`)
- **RTL** by default (Arabic); English renders LTR
- Anonymous **saved products** keyed to a per-device UUID (`X-Device-Id`) — no accounts in MVP

## Typography

Arabic-first pairing: **IBM Plex Sans Arabic** (Arabic) + **Inter** (Latin). Both
open-source and editorial-neutral, matching the SSENSE/Aritzia restraint locked
in `04_PRODUCT_AND_UX_REFERENCES.md`. Load them via your font provider of choice
or self-host; the CSS references them by name and falls back to `system-ui`.
Swap is trivial — change `--font-sans` in `app/globals.css`.

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

Nike-style guided finder, user accounts/auth, following brands, collections (no
backend entity), native mobile app. See root `08_PREBUILD_CHECKLIST_AND_BUILD_ORDER.md`.
