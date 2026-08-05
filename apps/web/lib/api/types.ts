/**
 * Frontend API types — mirror the exact JSON shapes returned by the NestJS
 * `/v1` public API (see apps/backend/src/v1/products/product-mapper.ts and the
 * controllers). These are deliberately defined locally rather than imported
 * from @maarood/schema so the frontend depends only on the HTTP contract, not
 * on Drizzle row shapes.
 */

export type CurrencyCode = string; // branded 3-letter code, e.g. "EGP"
export type Availability = "in_stock" | "out_of_stock" | "unknown";

export interface Variant {
  label: string;
  size?: string;
  color?: string;
  sku?: string;
  availability: Availability;
}

/**
 * The product object as returned by every product-returning endpoint
 * (lists, detail, brand products, search, and nested under `saved`).
 */
export interface PublicProduct {
  id: string;
  merchantId: string;
  sourceUrl: string;
  merchantProductId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  currentPrice: number;
  previousPrice: number | null;
  currency: CurrencyCode;
  availability: Availability;
  variants: Variant[];
  sizes: string[];
  colors: string[];
  imageUrls: string[];
  redirectUrl: string | null;
  revisionNumber: number;
  stale: boolean;
  lastSeenAt: string;
  lastUpdatedAt: string | null;
}

/** Paginated envelope: /v1/products, /v1/search, and nested brand products. */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

/** GET /v1/brands item. */
export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  domain: string;
  productCount: number;
}

/** GET /v1/brands/:slug brand object. */
export interface BrandDetail {
  id: string;
  name: string;
  slug: string;
  domain: string;
}

export interface BrandDetailResponse {
  brand: BrandDetail;
  products: PaginatedResult<PublicProduct>;
}

/** GET /v1/categories item. */
export interface CategorySummary {
  name: string;
  productCount: number;
}

/** Saved product entry (GET /v1/saved). */
export interface SavedProduct {
  savedAt: string;
  product: PublicProduct;
}

/** Query params for /v1/products and /v1/search. */
export type ProductSort = "newest" | "price_asc" | "price_desc" | "relevance";

export interface ProductQuery {
  brand?: string; // merchant slug
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: Availability;
  color?: string;
  size?: string;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

/** Uniform error envelope (apps/backend/src/common/all-exceptions.filter.ts). */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Typed error thrown by the API client. `status` is the HTTP status code. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message || "API request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
  }
}

/** A product was not found (404). */
export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, { error: { code: "not_found", message } });
    this.name = "NotFoundError";
  }
}
