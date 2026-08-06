ALTER TABLE "products" ADD COLUMN "vendor" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "options" text DEFAULT '[]' NOT NULL;