# Pre-Build Checklist, Metrics, and Build Order

## Decisions already closed

- Launch focus: Egyptian online-first brands.
- First category: fashion and accessories.
- Business model: discovery and merchant redirection, not owned checkout.
- Product imagery: use original merchant images in the MVP.
- Web: Next.js on Vercel.
- Mobile: React Native with Expo after web validation.
- Backend API: NestJS (TypeScript) on Cloud Run.
- Backend and jobs: Cloud Run.
- Database: PostgreSQL.
- Scraping: Crawlee + Cheerio + Playwright.
- Paid scraper fallbacks: Browserless, then Zyte where required.
- Brand palette, logo direction, messaging, and design references.

## Open implementation steps before or during the build

### 1. Initial supply

The initial brand list will be determined while testing the backend and ingestion reliability.

Target direction:

- Build a shortlist of 30–50 candidate brands.
- Measure extraction difficulty, catalog quality, image quality, update frequency, and category density.
- Prioritize brands that create a coherent and useful launch catalog.

### 2. Exact MVP feature specification

Confirm acceptance criteria for:

- Search.
- Filters.
- Category pages.
- Brand pages.
- Product details.
- Saved items.
- Redirect tracking.
- Authentication requirements.
- Admin corrections.

### 3. Product taxonomy and schema

Finalize:

- Category hierarchy.
- Variant model.
- Sizes.
- Colors.
- Price and sale handling.
- Availability states.
- Product freshness and timestamps.
- Duplicate-product rules.

### 4. Wireframes and interaction rules

Create core wireframes for:

- Home/discovery.
- Search results.
- Category page.
- Brand page.
- Product detail.
- Saved products.
- Filters and sorting.
- Empty, loading, error, and stale-product states.

### 5. Merchant and legal rules

Define:

- Image and product-data usage policy.
- Merchant attribution requirements.
- Opt-out and removal process.
- Terms of use.
- Privacy policy.
- Cookie and analytics policy.
- Affiliate-link disclosure where applicable.
- User-photo consent and deletion policy before any future virtual try-on test.

### 6. Success metrics

Primary metric:

> **Qualified outbound clicks from Maaroud to merchant websites**

Supporting metrics:

- Number of active brands.
- Number of valid indexed products.
- Catalog freshness.
- Search success rate.
- Zero-result search rate.
- Product-to-merchant click-through rate.
- Returning users.
- Saved products.
- Followed brands or categories when introduced.
- Cost per qualified outbound click.
- Traffic delivered per merchant.

Do not optimize primarily for impressions, follower count, or app installs.

### 7. Operations

Define and implement:

- Crawl frequency per merchant.
- Failed-crawler alerts.
- Broken-link handling.
- Stale-product handling.
- Price and stock update rules.
- Manual review queue.
- Merchant correction and opt-out process.
- Data-quality dashboard.

## Recommended build order — Locked

### Phase 1: Data ingestion and administration

- Canonical catalog schema.
- Merchant/source model.
- First connectors.
- Crawl scheduling and retries.
- Normalization pipeline.
- Admin review and correction tools.
- Freshness and failure monitoring.

### Phase 2: Backend and search

- Public API.
- Brand, category, product, and collection endpoints.
- Search and filtering.
- Saved-product support.
- Outbound-click tracking.
- Authentication only where needed.

### Phase 3: Responsive website

- Core design system.
- Search-first home experience.
- Category, brand, product, and saved pages.
- SEO and structured page metadata.
- Analytics and funnel tracking.
- Closed beta with real catalog data.

### Phase 4: Validation and growth loop

- Merchant onboarding process.
- Co-marketing assets.
- User testing.
- Search-quality improvements.
- Catalog-density improvements.
- Measure qualified outbound traffic and repeat use.

### Phase 5: Mobile application

- React Native with Expo.
- Reuse backend, account system, search, saved products, and design tokens.
- Add mobile-specific discovery, notifications, and retention features only after web behavior is validated.

### Phase 6: Deferred AI experiments

- AI-assisted standardized product visuals.
- Personal virtual try-on.
- Conversational product finding.

These are experiments, not dependencies for the MVP launch.
