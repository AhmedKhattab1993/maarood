CREATE TABLE IF NOT EXISTS "crawl_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"records_extracted" integer DEFAULT 0 NOT NULL,
	"records_upserted" integer DEFAULT 0 NOT NULL,
	"records_flagged" integer DEFAULT 0 NOT NULL,
	"revisions_created" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"merchant_product_id" text,
	"stage" text NOT NULL,
	"error_message" text NOT NULL,
	"raw_payload" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"source_url" text NOT NULL,
	"merchant_product_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text NOT NULL,
	"current_price" numeric(12, 2) NOT NULL,
	"previous_price" numeric(12, 2),
	"currency" text NOT NULL,
	"availability" text NOT NULL,
	"variants" text NOT NULL,
	"sizes" text NOT NULL,
	"colors" text NOT NULL,
	"image_urls" text NOT NULL,
	"redirect_url" text,
	"source_checksum" text NOT NULL,
	"crawl_run_id" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "raw_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"merchant_product_id" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"source_type" text NOT NULL,
	"checksum" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "connector_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "revision_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_errors" ADD CONSTRAINT "product_errors_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_revisions" ADD CONSTRAINT "product_revisions_crawl_run_id_crawl_runs_id_fk" FOREIGN KEY ("crawl_run_id") REFERENCES "public"."crawl_runs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "raw_snapshots" ADD CONSTRAINT "raw_snapshots_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crawl_runs_merchant_idx" ON "crawl_runs" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crawl_runs_started_idx" ON "crawl_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_errors_status_idx" ON "product_errors" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_errors_merchant_idx" ON "product_errors" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_revisions_product_revision_idx" ON "product_revisions" USING btree ("product_id","revision_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_revisions_product_idx" ON "product_revisions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "raw_snapshots_merchant_product_idx" ON "raw_snapshots" USING btree ("merchant_id","merchant_product_id");