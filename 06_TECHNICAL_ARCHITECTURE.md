# Technical Architecture

## Architecture principle — Locked

Use Vercel for the user-facing web experience and Google Cloud Platform for APIs, scraping, background work, and operational infrastructure.

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

## Backend API

Choose one implementation language for the main application backend:

- **NestJS** if prioritizing a TypeScript-first stack.
- **FastAPI** if prioritizing Python and future ML integration.

Host the API on **Google Cloud Run**.

## Background and ingestion workloads

- **Cloud Run Jobs** for scraping and catalog imports.
- **Cloud Scheduler** for recurring crawl schedules.
- **Cloud Tasks** or **Pub/Sub** for queues, retries, and asynchronous processing.

## Database

- **PostgreSQL** as the primary database.
- Initial managed option: **Neon** or **Supabase**.
- Later migration option: **Google Cloud SQL** when scale, reliability requirements, or GCP integration justify the additional baseline cost.

## Files and images

- **Google Cloud Storage** for product-image copies, cached media, exports, and operational files where storing them is legally and technically appropriate.
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
