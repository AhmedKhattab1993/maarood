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

### Nike — Guided-discovery and product-discovery visual reference

Study for:

- Short guided product-selection flows.
- Needs-based filtering.
- Future conversational or AI-assisted product discovery.
- **Product-discovery visual system** (added 2026-08-06): the look of the
  product grid, filter rail, and listing pages — flat white canvas, near-black
  type, square-cornered product cards, dense borderless grid, left filter rail,
  sticky minimal header, hover affordances.

> **Direction change (2026-08-06):** Nike is now the visual lead for all
> product-*discovery* surfaces (home grid, search, category, brand listings).
> This supersedes the earlier Locked decision that kept Nike interaction-only.
> Rationale: a focused, image-forward discovery look is the strongest fit for
> browsing a normalized multi-brand catalog, and Nike's system is the clearest
> expression of it. SSENSE and Aritzia remain the visual lead for the
> *product-detail* page (restrained, product-first presentation) and as
> secondary influences on typography and spacing. See "Two independent axes".

## Target Maaroud experience mix — Locked

- **70% search and utility**
- **20% curated discovery**
- **10% brand storytelling**

## Two independent axes — Locked (revised 2026-08-06)

References serve two separate purposes and must not be conflated:

- **Interaction / UX flow** — how the product behaves. Lead references: **Nike product finders** (guided discovery) and **Shop by Shopify** (save, follow, mobile navigation).
- **Visual craft / system** — what the product looks like. Split by surface:
  - **Product-discovery surfaces** (home grid, search, category, brand listings, filter rail): lead reference is **Nike** — flat white canvas, near-black type, square product cards, dense borderless grid. See the Nike section above.
  - **Product-detail page**: lead references remain **SSENSE** and **Aritzia** — restrained, product-first presentation, where the editorial gallery framing still applies.

The earlier rationale that Nike's identity would "compete with hosted brands" no longer holds for the discovery surfaces: Maarood's grid treats every product uniformly on a neutral white canvas, so the visual system does not favor any one brand. Product detail keeps the editorial SSENSE/Aritzia treatment where per-product framing matters most.

## Per-page reference map — Locked

Each Maaroud page is modeled on the reference best suited to its structure. Page types that only multi-brand retailers have built (brand pages, deep category grids) are taken from SSENSE/Aritzia/Farfetch; Nike and Shop each own specific pages they uniquely model.

| Maaroud page | Structural reference | Visual reference |
|---|---|---|
| Home / discovery (logged-out) | **Aritzia** (merchandising) | **Nike** (grid) |
| Home / discovery (logged-in) | **Shop by Shopify** | Nike grid, when introduced |
| Search results | **SSENSE** (dense filtering) | **Nike** |
| Category listing | **SSENSE / Aritzia** (taxonomy) | **Nike** |
| Brand page | **Aritzia / Farfetch** | **Nike** |
| Product detail | **SSENSE** | **SSENSE** (editorial) |
| Discovery finder (when built) | **Nike product finders** | Nike |
| Mobile navigation shell | **Shop by Shopify** | Nike chrome |
| Saved products | **Shop by Shopify** | Nike grid |

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
