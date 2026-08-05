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
} from 'drizzle-orm/pg-core';
import type { Availability, CurrencyCode } from '../product.schema';

/** Availability values allowed on the products table. */
const availabilityEnum = ['in_stock', 'out_of_stock', 'unknown'] as const satisfies readonly Availability[];

export const merchants = pgTable(
  'merchants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    domain: text('domain').notNull(),
    crawlFrequencyMinutes: integer('crawl_frequency_minutes').notNull().default(1440),
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
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
    lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }),
  },
  (t) => ({
    merchantProductIdx: index('products_merchant_product_idx').on(t.merchantId, t.merchantProductId),
    categoryIdx: index('products_category_idx').on(t.category),
    availabilityIdx: index('products_availability_idx').on(t.availability),
    lastSeenIdx: index('products_last_seen_idx').on(t.lastSeenAt),
  }),
);

export type ProductRow = typeof products.$inferSelect;
export type MerchantRow = typeof merchants.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type NewMerchantRow = typeof merchants.$inferInsert;
