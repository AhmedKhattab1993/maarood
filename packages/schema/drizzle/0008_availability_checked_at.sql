ALTER TABLE "products" ADD COLUMN "availability_checked_at" timestamp with time zone;
UPDATE "products" SET "availability_checked_at" = "last_seen_at" WHERE "availability_checked_at" IS NULL;
