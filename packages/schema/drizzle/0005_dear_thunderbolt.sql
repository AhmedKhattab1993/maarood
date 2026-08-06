ALTER TABLE "product_revisions" ADD COLUMN "vendor" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_revisions" ADD COLUMN "options" text DEFAULT '[]' NOT NULL;