# Scraping and Catalog Ingestion

## Primary implementation — Locked

- **TypeScript** for scraper services.
- **Crawlee** for crawl orchestration, URL queues, retries, concurrency, sessions, and proxy support.
- **Cheerio** for fast static HTML parsing.
- **Playwright** for JavaScript-rendered and interactive pages.
- **Zod** for schema validation in the TypeScript implementation.
- Direct HTTP requests before browser rendering whenever possible.

Optional Python components:

- **Scrapy** for specialized high-throughput static crawling.
- **Pydantic** where Python validation is used.

## Hosting — Locked

- Scraper services and scheduled import jobs run on **Google Cloud Run Jobs**.
- Scheduling through **Cloud Scheduler**.
- Queues and retries through **Cloud Tasks** or **Pub/Sub**.

## Retrieval priority — Locked

Each merchant connector should attempt the cheapest and most reliable method in this order:

1. Official merchant feed or API.
2. Platform-specific structured data or public JSON endpoints.
3. Static HTML retrieval and parsing.
4. Playwright browser rendering.
5. Paid unblocking or managed browser service.
6. Manual merchant-provided feed if the site remains unreliable.

## Paid-service fallback hierarchy — Locked

### Browserless

Use first when managing Chromium infrastructure becomes operationally expensive or unreliable.

Best for:

- Managed Playwright browser sessions.
- Remote browser execution.
- Reducing browser-container maintenance.

### Zyte API

Use selectively for difficult or blocked merchants.

Best for:

- Anti-bot challenges.
- Proxy and rendering fallback.
- Difficult pages where normal Crawlee/Playwright retrieval fails.

### Other services considered but not selected initially

- Apify.
- ScrapingBee.
- Oxylabs.
- Bright Data.
- Firecrawl.

Do not subscribe to multiple paid scraping platforms at the start.

## Connector architecture — Locked

Each merchant connector should independently select its extraction method so that:

- Easy stores use inexpensive HTTP retrieval.
- Dynamic stores use Playwright only when required.
- Blocked stores use paid fallback selectively.
- Official feeds replace scraping for strategic participating brands.

## Catalog pipeline

Recommended stages:

1. Discover source URLs.
2. Retrieve raw page or feed data.
3. Extract raw product records.
4. Validate source-specific schema.
5. Normalize into the Maaroud canonical schema.
6. Match categories, colors, sizes, and variants.
7. Detect duplicates and changed records.
8. Store source attribution and timestamps.
9. Publish valid records to search and frontend APIs.
10. Flag failures and stale records for review.

## Canonical product data requirements

At minimum, support:

- Merchant/brand identifier.
- Source URL.
- Product title.
- Description.
- Category and subcategory.
- Current price.
- Previous price where available.
- Currency.
- Availability.
- Variants.
- Sizes.
- Colors.
- Image URLs.
- Merchant product identifier.
- Last-seen and last-updated timestamps.
- Redirect/affiliate URL where available.
- Raw source snapshot reference or checksum.

## Operational requirements

- Idempotent re-crawls.
- Per-store crawl frequency.
- Retries with backoff.
- Rate limiting.
- Broken-link detection.
- Stale-product detection.
- Data-change logging.
- Merchant opt-out and removal workflow.
- Manual correction capability through an admin tool.
