# Technical Architecture

## Architecture principle — Locked

Use Vercel for the user-facing web experience, the API, and background work; Neon Postgres as the managed database. No containers — every workload runs on Fluid compute (Node.js server functions and workflow steps).

## Frontend

### Web

- **Next.js**
- Hosted on **Vercel**
- Responsive and mobile-first
- SEO-friendly product, brand, category, and collection pages

### Mobile

- **React Native with Expo**
- Uses the same backend API, authentication, catalog, and design system as the web product
- Built after the web experience is validated

## Backend API — Locked

- **NestJS (TypeScript)** as the main application backend.
- The API is the NestJS app deployed as a **zero-config Node.js server function** (Vercel auto-detects `src/main.ts`), region `fra1`.

### Rationale

- The scraping layer is locked as TypeScript with **Zod** schema validation. NestJS shares the same language and the canonical product schema directly across ingestion, normalization, and API, avoiding duplicate schema definitions and drift.
- TypeScript also unifies the backend with the Next.js frontend (shared request/response types, single toolchain).
- The only argument for the alternative (FastAPI/Python) is future ML work, which is deferred to Phase 6 experiments and is not an MVP dependency. Adding a narrow Python microservice later is cheap if a validated ML need arises; rewriting the core API is not.

### Python carve-out

If a specific, validated ML need emerges (for example, real semantic search with embeddings), add a small Python function/container service for that capability only. Do not retroactively rewrite the core backend in Python.

## Background and ingestion workloads

- Crawling runs as a **Vercel Workflow** (`apps/web/workflows/crawl.ts`, hosted in the Next.js app): Vercel Cron calls `GET /api/cron/crawl` every 6h; one durable, auto-retried step per due merchant; run duration unbounded so merchant count can grow without redesign. Overlapping runs are harmless (due-logic + idempotent upserts).
- The scraper CLI (`npm run scrape` / `scrape:all`) remains the local and fallback path.
- Queues (QStash, `pg-boss`) are deferred until a validated need — Workflows already provides durable, retried execution.

## Database

- **PostgreSQL** as the primary database.
- Initial managed option: **Neon** or **Supabase**.
- Later migration option: a dedicated managed Postgres (e.g., Cloud SQL) when scale or reliability requirements justify the additional baseline cost.

## Files and images

- **Vercel Blob** for product-image copies, cached media, exports, and operational files where storing them is legally and technically appropriate (when the need materializes).
- Preserve original merchant image URLs and attribution in the product record.

## Search

Search implementation remains open for benchmarking, but the data model should support:

- Text search.
- Arabic and English normalization.
- Brand, category, price, color, size, and availability filters.
- Typo tolerance.
- Synonyms.
- Future semantic or conversational search.

A PostgreSQL-based MVP search can be tested first before adding a dedicated search engine.

## Shared architectural requirements

- One canonical product schema shared across web and mobile.
- Store-specific ingestion connectors isolated from the core product API.
- Idempotent imports.
- Product-source traceability.
- Outbound-click tracking.
- Crawl and data-freshness timestamps.
- Clear separation between raw merchant data and normalized catalog data.
- Monitoring for crawler failures, broken links, stale records, and API errors.
