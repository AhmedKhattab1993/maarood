/**
 * Drizzle table definitions for the canonical schema.
 *
 * Column types are derived from the Zod schema's TypeScript output
 * so the DB and the API/ingestion contracts stay in sync. See
 * ../product.schema.ts for the authoritative field list.
 */

import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  integer,
  index,
  jsonb,
  uniqueIndex,
  boolean,
} from 'drizzle-orm/pg-core';
import type { Availability, CurrencyCode } from '../product.schema';

/** Availability values allowed on the products table. */
const availabilityEnum = [
  'in_stock',
  'out_of_stock',
  'unknown',
] as const satisfies readonly Availability[];

export const merchants = pgTable(
  'merchants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    domain: text('domain').notNull(),
    /** Per-store crawl cadence, in minutes. */
    crawlFrequencyMinutes: integer('crawl_frequency_minutes').notNull().default(1440),
    /** Connector implementation to use, e.g. 'shopify'. Selects the ingestion strategy. */
    connectorType: text('connector_type').notNull(),
    /** When true, the merchant is excluded from all crawls (opt-out / removal hook). */
    optedOut: boolean('opted_out').notNull().default(false),
    /** Free-form admin notes (corrections, contacts, context). */
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    domainIdx: index('merchants_domain_idx').on(t.domain),
  }),
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    sourceUrl: text('source_url').notNull(),
    merchantProductId: text('merchant_product_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    category: text('category').notNull().default(''),
    subcategory: text('subcategory').notNull().default(''),
    /** Numeric precision preserved for EGP prices; 2 decimals is sufficient for retail. */
    currentPrice: numeric('current_price', { precision: 12, scale: 2 }).notNull(),
    previousPrice: numeric('previous_price', { precision: 12, scale: 2 }),
    currency: text('currency')
      .notNull()
      .$type<CurrencyCode>(),
    availability: text('availability', { enum: availabilityEnum }).notNull().default('unknown'),
    /** JSON columns defer structure enforcement to the Zod schema on read/write. */
    variants: text('variants').notNull().default('[]'),
    sizes: text('sizes').notNull().default('[]'),
    colors: text('colors').notNull().default('[]'),
    imageUrls: text('image_urls').notNull().default('[]'),
    redirectUrl: text('redirect_url'),
    sourceChecksum: text('source_checksum').notNull().default(''),
    /** Current revision number for this product; increments on each material change. */
    revisionNumber: integer('revision_number').notNull().default(1),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
    lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }),
    /**
     * Set when a product was not seen in the latest crawl of its merchant
     * (i.e. it disappeared from the source). Cleared if it reappears.
     */
    staleAt: timestamp('stale_at', { withTimezone: true }),
  },
  (t) => ({
    merchantProductIdx: index('products_merchant_product_idx').on(t.merchantId, t.merchantProductId),
    categoryIdx: index('products_category_idx').on(t.category),
    availabilityIdx: index('products_availability_idx').on(t.availability),
    lastSeenIdx: index('products_last_seen_idx').on(t.lastSeenAt),
  }),
);

/**
 * Append-only full snapshot of a product at a material change point.
 * `products` holds current state; this table holds the full timeline.
 */
export const productRevisions = pgTable(
  'product_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    revisionNumber: integer('revision_number').notNull(),
    // Full snapshot of material fields at this revision.
    sourceUrl: text('source_url').notNull(),
    merchantProductId: text('merchant_product_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    subcategory: text('subcategory').notNull(),
    currentPrice: numeric('current_price', { precision: 12, scale: 2 }).notNull(),
    previousPrice: numeric('previous_price', { precision: 12, scale: 2 }),
    currency: text('currency')
      .notNull()
      .$type<CurrencyCode>(),
    availability: text('availability', { enum: availabilityEnum }).notNull(),
    variants: text('variants').notNull(),
    sizes: text('sizes').notNull(),
    colors: text('colors').notNull(),
    imageUrls: text('image_urls').notNull(),
    redirectUrl: text('redirect_url'),
    sourceChecksum: text('source_checksum').notNull(),
    crawlRunId: uuid('crawl_run_id').references(() => crawlRuns.id),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    productRevisionIdx: uniqueIndex('product_revisions_product_revision_idx').on(
      t.productId,
      t.revisionNumber,
    ),
    productIdx: index('product_revisions_product_idx').on(t.productId),
  }),
);

/** One row per crawl execution of a merchant connector. */
export const crawlRuns = pgTable(
  'crawl_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: text('status', { enum: ['running', 'completed', 'failed'] })
      .notNull()
      .default('running'),
    recordsExtracted: integer('records_extracted').notNull().default(0),
    recordsUpserted: integer('records_upserted').notNull().default(0),
    recordsFlagged: integer('records_flagged').notNull().default(0),
    revisionsCreated: integer('revisions_created').notNull().default(0),
    errorMessage: text('error_message'),
  },
  (t) => ({
    merchantIdx: index('crawl_runs_merchant_idx').on(t.merchantId),
    startedIdx: index('crawl_runs_started_idx').on(t.startedAt),
  }),
);

/** Raw merchant payload snapshot, kept for debugging and reprocessing. */
export const rawSnapshots = pgTable(
  'raw_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    merchantProductId: text('merchant_product_id').notNull(),
    rawPayload: jsonb('raw_payload').notNull(),
    /** Where the raw data came from, e.g. 'shopify_json'. */
    sourceType: text('source_type').notNull(),
    checksum: text('checksum').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    merchantProductIdx: index('raw_snapshots_merchant_product_idx').on(
      t.merchantId,
      t.merchantProductId,
    ),
  }),
);

/** Review queue for records that failed validation/normalization/storage. */
export const productErrors = pgTable(
  'product_errors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    merchantProductId: text('merchant_product_id'),
    stage: text('stage', { enum: ['extract', 'validate', 'normalize', 'store'] }).notNull(),
    errorMessage: text('error_message').notNull(),
    rawPayload: jsonb('raw_payload'),
    status: text('status', { enum: ['pending', 'resolved'] }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('product_errors_status_idx').on(t.status),
    merchantIdx: index('product_errors_merchant_idx').on(t.merchantId),
  }),
);

/** Anonymous saved-product list, keyed by a client-generated device UUID. */
export const savedProducts = pgTable(
  'saved_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviceId: uuid('device_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    deviceProductUnique: uniqueIndex('saved_products_device_product_idx').on(t.deviceId, t.productId),
    deviceIdx: index('saved_products_device_idx').on(t.deviceId),
  }),
);

/** Outbound-click log — Maaroud's primary success metric (qualified clicks to merchants). */
export const outboundClicks = pgTable(
  'outbound_clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id),
    /** Optional anonymous device id for attribution. */
    deviceId: uuid('device_id'),
    destinationUrl: text('destination_url').notNull(),
    referer: text('referer'),
    clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index('outbound_clicks_product_idx').on(t.productId),
    merchantIdx: index('outbound_clicks_merchant_idx').on(t.merchantId),
    clickedIdx: index('outbound_clicks_clicked_idx').on(t.clickedAt),
  }),
);

export type ProductRow = typeof products.$inferSelect;
export type MerchantRow = typeof merchants.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type NewMerchantRow = typeof merchants.$inferInsert;
export type ProductRevisionRow = typeof productRevisions.$inferSelect;
export type NewProductRevisionRow = typeof productRevisions.$inferInsert;
export type CrawlRunRow = typeof crawlRuns.$inferSelect;
export type NewCrawlRunRow = typeof crawlRuns.$inferInsert;
export type RawSnapshotRow = typeof rawSnapshots.$inferSelect;
export type NewRawSnapshotRow = typeof rawSnapshots.$inferInsert;
export type ProductErrorRow = typeof productErrors.$inferSelect;
export type NewProductErrorRow = typeof productErrors.$inferInsert;
export type SavedProductRow = typeof savedProducts.$inferSelect;
export type NewSavedProductRow = typeof savedProducts.$inferInsert;
export type OutboundClickRow = typeof outboundClicks.$inferSelect;
export type NewOutboundClickRow = typeof outboundClicks.$inferInsert;
