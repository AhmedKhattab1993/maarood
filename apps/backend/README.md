# Maarood Backend

NestJS + TypeScript + Drizzle + PostgreSQL, deployed as a zero-config **Vercel function** (Vercel auto-detects the NestJS server entrypoint). Crawling lives in the web project's Vercel Workflow — this service is a pure API.

Shared canonical schema lives in [`packages/schema`](../../packages/schema) and is consumed by both this backend and the future scraper package — the contract for ingestion and the API cannot drift.

## Environment setup

Secrets live in **`~/.maarood.env`** (user-level, outside the repo) — mirroring the `theultimate-core` convention. No `.env` files are committed.

Create `~/.maarood.env` with at least:

```
NODE_ENV=development
PORT=8080
DATABASE_URL=postgresql://maarood:dev@localhost:5432/maarood
```

(`GCS_BUCKET_NAME` is optional and unused in the MVP — image URLs come from the merchant.)

Precedence (low → high): code defaults → `~/.maarood.env` → process env. The Zod schema in `src/config/env.schema.ts` validates everything at boot and **fails fast** on misconfiguration.

Naming: `UPPER_SNAKE_CASE`; project keys are prefixed where domain-specific. Secrets end in `_API_KEY` / `_SECRET` / `_TOKEN`.

## Local development

The MVP runs entirely locally — no cloud services are needed for development. Vercel (functions + workflow) + Neon is only the deploy target.

```bash
# from repo root
npm install

# start the local Postgres (Docker) and apply the schema
npm run db:up
npm run db:migrate

# run the backend (NestJS watch mode)
npm run dev

# checks
npm run typecheck
npm run lint
```

`DATABASE_URL` in `~/.maarood.env` points at the local Docker Postgres during development; the same key points at Neon in production. **Same code, only the config differs.**

`GET /health` returns `{ "status": "ok" }`; `GET /health?deep=true` also pings the DB with `SELECT 1` (useful to confirm `DATABASE_URL` is wired correctly).

## Public API (`/v1`)

Catalog discovery is public. Saved products and followed brands require an
account bearer token; the personalized feed accepts an optional verified token
to add account preferences to anonymous browsing signals.

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/products` | Paginated list with filters (`brand`, `category`, `minPrice`, `maxPrice`, `availability`, `color`, `size`, `sort`, `page`, `limit`) |
| POST | `/v1/feed` | Private personalized discovery; read-only, optional bearer token |
| GET | `/v1/products/:id` | Single product |
| GET | `/v1/products/:id/redirect` | Log outbound click → 302 to merchant (primary success metric) |
| GET | `/v1/brands` | Brands with product counts |
| GET | `/v1/brands/:slug` | Brand detail + paginated products |
| GET | `/v1/categories` | Distinct categories with counts |
| GET | `/v1/search?q=` | Full-text search (FTS + typo-tolerant trigram) with the same filters |
| GET | `/v1/saved` | Saved products for the signed-in account |
| POST | `/v1/saved/:productId` | Save a product (requires bearer token) |
| DELETE | `/v1/saved/:productId` | Unsave a product |

Pagination: `?page=1&limit=24` (max 60); responses return `{ items, page, limit, total }`.

Search requires every requested concept to match, while accepting bilingual
synonyms within each concept and whole-word typos for longer terms. Colors
match the title or color options, not incidental description text. Brand names
can stand alone or accompany a product query. Explicit sorts and catalog
filters apply consistently; category aliases normalize to canonical categories.

### Personalized feed

`POST /v1/feed` accepts `{ seed, page?, limit?, query?, profile?, seenIds? }`:

- `seed`: 1–120 characters; the web client uses `timestamp:uuid`, with the
  timestamp in milliseconds to bound newly added saved/followed signals.
- `page` / `limit`: ordinary pagination, with at most 60 products per page.
- `query`: existing product filters. Explicit price/newest sorting belongs on
  `/v1/products`; this endpoint always ranks recommendations.
- `profile`: `{ categories: { [category]: weight }, merchants: { [uuid]: weight } }`.
  Weights are finite numbers from 0 to 100; the request bounds map sizes.
- `seenIds`: at most 300 product UUIDs to demote behind unseen products.

The response is `{ items, page, limit, total }`, with
`Cache-Control: private, no-store`. Preferences cannot supply an account ID:
only a cryptographically verified optional bearer token selects account saves
and follows. The endpoint has no writes and needs no schema migration.

Ranking runs in PostgreSQL before pagination: weighted seeded exploration,
recent-impression demotion, two-product merchant rounds, and a stable UUID
tiebreak. Keep the seed, profile, and seen IDs unchanged while paging. Generate
a new seed for a fresh visit or refresh. Catalog changes or removing saved/follow
signals can still change a running page sequence; the client removes duplicates.

Optional database regression suites use a dedicated test connection:
`MAAROOD_FEED_TEST_DATABASE_URL=postgresql://... npx vitest run apps/backend/src/v1/feed`.
Feed fixtures are read-only SQL CTEs and never modify catalog records.

## Admin API

JSON only (no UI). All routes require `Authorization: Bearer <ADMIN_TOKEN>`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/merchants` | List merchants |
| POST | `/admin/merchants` | Register a merchant |
| PATCH | `/admin/merchants/:slug` | Update opt-out / notes / crawl frequency |
| GET | `/admin/crawl-runs` | Recent crawl runs (`?merchantSlug=` filter) |
| GET | `/admin/review-queue` | Product-error review queue (`?status=` filter) |
| PATCH | `/admin/review-queue/:id` | Resolve a flagged record |
| DELETE | `/admin/products/:id` | Manually remove a product (admin correction) |
| GET | `/admin/products/:id/revisions` | Full change history for a product |
| GET | `/admin/health/ingestion` | Freshness, failures, staleness across merchants |

## Database

```bash
# generate migrations from the Drizzle schema
npm run db:generate --workspace @maarood/schema

# apply migrations (requires DATABASE_URL)
npm run db:migrate --workspace @maarood/schema
```

## Deploy to Vercel

The backend deploys as a **Node.js server function** — Vercel auto-detects NestJS via `src/main.ts`; no Dockerfile, no build overrides. Project settings: Root Directory `apps/backend`, region `fra1`, env vars per [`deploy/README.md`](../../deploy/README.md). Manual crawls are triggered through the web project's cron route (or the scraper CLI), not this API.
