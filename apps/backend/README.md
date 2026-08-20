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

The public API serves the future web frontend and mobile app. No authentication; saved products are anonymous (keyed by a client-generated `X-Device-Id` UUID header).

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/products` | Paginated list with filters (`brand`, `category`, `minPrice`, `maxPrice`, `availability`, `color`, `size`, `sort`, `page`, `limit`) |
| GET | `/v1/products/:id` | Single product |
| GET | `/v1/products/:id/redirect` | Log outbound click → 302 to merchant (primary success metric) |
| GET | `/v1/brands` | Brands with product counts |
| GET | `/v1/brands/:slug` | Brand detail + paginated products |
| GET | `/v1/categories` | Distinct categories with counts |
| GET | `/v1/search?q=` | Full-text search (FTS + typo-tolerant trigram) with the same filters |
| GET | `/v1/saved` | Saved products for `X-Device-Id` |
| POST | `/v1/saved/:productId` | Save a product (requires `X-Device-Id`) |
| DELETE | `/v1/saved/:productId` | Unsave a product |

Pagination: `?page=1&limit=24` (max 60); responses return `{ items, page, limit, total }`.

Search uses PostgreSQL full-text (tsvector over title/description/category) plus `pg_trgm` similarity for typo tolerance, with a simple Arabic+English normalizer. Synonyms and semantic search are deferred per `06_TECHNICAL_ARCHITECTURE.md`.

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
