CREATE TABLE IF NOT EXISTS "outbound_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"device_id" uuid,
	"destination_url" text NOT NULL,
	"referer" text,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_products" ADD CONSTRAINT "saved_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbound_clicks_product_idx" ON "outbound_clicks" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbound_clicks_merchant_idx" ON "outbound_clicks" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbound_clicks_clicked_idx" ON "outbound_clicks" USING btree ("clicked_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saved_products_device_product_idx" ON "saved_products" USING btree ("device_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_products_device_idx" ON "saved_products" USING btree ("device_id");--> statement-breakpoint

-- Full-text search support (PostgreSQL MVP search per 06_TECHNICAL_ARCHITECTURE.md).
-- pg_trgm enables typo-tolerant similarity matching; the 'simple' dictionary
-- tokenizes both Arabic and English without requiring locale packages.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

-- Generated search vector over title + description + category + brand name.
-- Kept in sync automatically (GENERATED ALWAYS); no trigger needed.
ALTER TABLE "products" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce("title", '') || ' ' ||
      coalesce("description", '') || ' ' ||
      coalesce("category", '') || ' ' ||
      coalesce("subcategory", '') || ' ' ||
      coalesce("merchant_product_id", '')
    )
  ) STORED;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_title_trgm_idx" ON "products" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_description_trgm_idx" ON "products" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_current_price_idx" ON "products" USING btree ("current_price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_currency_idx" ON "products" USING btree ("currency");