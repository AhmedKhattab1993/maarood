# Product and UX References

The design should combine proven patterns from leading shopping and discovery products rather than copying a single interface.

## Locked references

### Lyst — Structural and information-architecture reference

Study for information architecture and data model only — **not a visual or interaction reference**:

- Multi-brand catalog normalization.
- Product search and filters.
- Merchant redirection.
- Trends and curated collections.
- Consistent display across many brands and stores.

Lyst is retained because it is the only reference here that models Maaroud's actual business problem — a cross-brand aggregator that normalizes a heterogeneous catalog and redirects to the merchant for checkout. The other references (single-brand or checkout-owning) cannot model the brand-page and catalog-structure requirements. Its experience and visual craft are below the bar set by the references below, so it informs structure only.

### Shop by Shopify — Mobile and retention reference

Study for:

- Personalized mobile discovery.
- Simple bottom navigation.
- Saving products.
- Following brands or stores.
- Notifications.
- Repeat-use journeys.

### SSENSE — Visual-system reference

Study for:

- Restrained typography.
- Disciplined product grids.
- Strong filters.
- Editorial content integrated with commerce.
- Minimal interface interference with product imagery.

### Farfetch — Multi-brand catalog reference

Study for:

- Consistency across heterogeneous merchant catalogs.
- Brand pages.
- Product recommendations.
- Broad assortment organization.
- Premium product-detail presentation.

### Aritzia — Merchandising reference

Study for:

- Category navigation.
- Collection storytelling.
- Mobile product cards.
- Typography and spacing.
- Organizing products by collection, occasion, and color.

### Nike product finders — Guided-discovery reference

Study for:

- Short guided product-selection flows.
- Needs-based filtering.
- Future conversational or AI-assisted product discovery.

## Target Maaroud experience mix — Locked

- **70% search and utility**
- **20% curated discovery**
- **10% brand storytelling**

## Two independent axes — Locked

References serve two separate purposes and must not be conflated:

- **Interaction / UX flow** — how the product behaves. Lead references: **Nike product finders** (guided discovery) and **Shop by Shopify** (save, follow, mobile navigation).
- **Visual craft / system** — what the product looks like. Lead references: **SSENSE** and **Aritzia**, the only multi-brand retailers in the set and therefore the only ones that have solved Maaroud's core visual problem: framing many visually different brands in one neutral, editorial gallery without competing with them.

Nike is single-brand and owns checkout; its strong visual identity would compete with hosted brands, so it is an interaction reference only. Shop is neutral but utilitarian, below the editorial craft bar in `02`, so it is a retention-interaction reference only.

## Per-page reference map — Locked

Each Maaroud page is modeled on the reference best suited to its structure. Page types that only multi-brand retailers have built (brand pages, deep category grids) are taken from SSENSE/Aritzia/Farfetch; Nike and Shop each own specific pages they uniquely model.

| Maaroud page | Structural reference | Why |
|---|---|---|
| Home / discovery (logged-out) | **Aritzia** | Collection storytelling, merchandising |
| Home / discovery (logged-in) | **Shop by Shopify** | Following/feed surface, when introduced |
| Search results | **SSENSE** | Disciplined grid, dense filtering |
| Category listing | **SSENSE / Aritzia** | Deep multi-brand taxonomy |
| Brand page | **Aritzia / Farfetch** | Only references with this page type |
| Product detail | **SSENSE** | Restrained, product-first presentation |
| Discovery finder (when built) | **Nike product finders** | Guided question → ranked results |
| Mobile navigation shell | **Shop by Shopify** | Bottom-tab navigation |
| Saved products | **Shop by Shopify** | Save and return journeys |

## Design principles

- Search must remain central.
- Unknown brands should be enjoyable to discover.
- Original merchant imagery should be shown without visual distortion.
- Product cards should use consistent aspect ratios, spacing, typography, and metadata placement.
- The interface should avoid the dense banner-heavy style of large discount marketplaces.
- The user should always understand which brand sells the product and where checkout occurs.

## Initial core screens

- Home / discovery.
- Search results.
- Category listing.
- Brand page.
- Product page or detail view.
- Saved products.
- Search and filters.
- Merchant redirect confirmation where useful.
