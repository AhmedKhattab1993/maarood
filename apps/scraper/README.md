# Maarood Scraper

Ingestion pipeline — a plain TypeScript library + CLI (not NestJS). In production
it runs **inside the backend service**: Vercel Cron hits `GET /admin/crawl`, which
calls `crawlDueMerchants` with a soft deadline. The backend imports it as
`@maarood/scraper`.
Implements the 10-stage pipeline from [`07_SCRAPING_AND_CATALOG_INGESTION.md`](../../07_SCRAPING_AND_CATALOG_INGESTION.md).

## Commands

```bash
npm run db:up          # local Postgres (if not already running)
npm run db:migrate     # apply schema

npm run seed           # register initial merchants (idempotent)
npm run scrape -- <slug>      # crawl one merchant
npm run scrape:all            # crawl every active merchant whose frequency has elapsed
```

Same code runs locally and in cloud. On Vercel, the library is invoked through
the backend's `/admin/crawl` endpoint behind Vercel Cron; the trigger differs,
the code does not.

## Connectors

- **`shopify`** — fetches a store's public `/products.json`. Works for any Shopify
  store with no per-store code. (Reaches nastrends.com, antikkaeg.com.)

Other connector types (HTML/Cheerio, Playwright) slot in by adding a factory to
`src/connectors/index.ts` — store-specific extraction stays isolated from the
shared pipeline.

## Pipeline rules (Phase 1 complete)

| Concern | Behavior |
|---|---|
| **Idempotency** | Keyed on `(merchant_id, merchant_product_id)`. Re-crawls never duplicate. |
| **Price/stock updates** | Material changes (price, availability, title, variants, images, …) update the `products` row **and** append a new `product_revisions` snapshot. Full history preserved. |
| **Unchanged products** | Only `last_seen_at` bumps. No revision, no noise. |
| **Stale products** | At the end of a successful run, products of that merchant not seen in the run are marked `availability = out_of_stock` and `stale_at = now()`. Reappearing in a later run clears `stale_at` and restores availability. |
| **Retries** | Connector fetch retries 3× with exponential backoff + jitter. Final failure marks the `crawl_run` as `failed` with the error. |
| **Per-product errors** | A bad record is written to `product_errors` (review queue) and flagged; the crawl continues. |
| **Opt-out** | `merchants.opted_out = true` excludes a merchant from `scrape:all` and `run-pipeline`. |
| **Frequency** | `scrape:all` skips merchants whose last crawl is younger than `merchants.crawl_frequency_minutes`. |

## Monitoring

The backend exposes `GET /admin/health/ingestion` — a single JSON payload with
per-merchant freshness state (`fresh` / `overdue` / `failed` / `never_crawled`),
recent failed crawl runs, and stale-product counts. A future alerter can poll it;
no push notifications are built in.
