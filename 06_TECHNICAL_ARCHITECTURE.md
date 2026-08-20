# Technical Architecture

## Architecture principle — Locked

Use Vercel for the user-facing web experience and for APIs, scraping, and background work; Neon Postgres as the managed database.

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
- Host the API as a containerized **Vercel Service** (`Dockerfile.vercel`), region `fra1` (Frankfurt, next to Neon).

### Rationale

- The scraping layer is locked as TypeScript with **Zod** schema validation. NestJS shares the same language and the canonical product schema directly across ingestion, normalization, and API, avoiding duplicate schema definitions and drift.
- TypeScript also unifies the backend with the Next.js frontend (shared request/response types, single toolchain).
- The only argument for the alternative (FastAPI/Python) is future ML work, which is deferred to Phase 6 experiments and is not an MVP dependency. Adding a narrow Python microservice later is cheap if a validated ML need arises; rewriting the core API is not.

### Python carve-out

If a specific, validated ML need emerges (for example, real semantic search with embeddings), add a small Python container service for that capability only. Do not retroactively rewrite the core backend in Python.

## Background and ingestion workloads

- The scraper runs **in-process inside the backend service**: Vercel Cron (`vercel.json`) calls `GET /admin/crawl` every 6h with a bearer token; a Postgres advisory lock prevents overlapping runs; a soft deadline under the function-duration limit leaves unvisited merchants due so the next run resumes them.
- The scraper CLI (`npm run scrape` / `scrape:all`) remains the local and fallback path.
- Queues/retries (QStash, Inngest, or `pg-boss` on Postgres) are deferred until a validated need — the cron + due-logic batch covers current requirements.

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
