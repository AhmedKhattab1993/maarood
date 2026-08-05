ALTER TABLE "merchants" ADD COLUMN "opted_out" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stale_at" timestamp with time zone;