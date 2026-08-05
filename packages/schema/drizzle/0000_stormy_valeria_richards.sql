CREATE TABLE IF NOT EXISTS "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain" text NOT NULL,
	"crawl_frequency_minutes" integer DEFAULT 1440 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"merchant_product_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"subcategory" text DEFAULT '' NOT NULL,
	"current_price" numeric(12, 2) NOT NULL,
	"previous_price" numeric(12, 2),
	"currency" text NOT NULL,
	"availability" text DEFAULT 'unknown' NOT NULL,
	"variants" text DEFAULT '[]' NOT NULL,
	"sizes" text DEFAULT '[]' NOT NULL,
	"colors" text DEFAULT '[]' NOT NULL,
	"image_urls" text DEFAULT '[]' NOT NULL,
	"redirect_url" text,
	"source_checksum" text DEFAULT '' NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"last_updated_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merchants_domain_idx" ON "merchants" USING btree ("domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_merchant_product_idx" ON "products" USING btree ("merchant_id","merchant_product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_availability_idx" ON "products" USING btree ("availability");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_last_seen_idx" ON "products" USING btree ("last_seen_at");