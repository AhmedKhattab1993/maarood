CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "followed_merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"followed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "followed_merchants" ADD CONSTRAINT "followed_merchants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "followed_merchants" ADD CONSTRAINT "followed_merchants_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "followed_merchants_user_merchant_idx" ON "followed_merchants" USING btree ("user_id","merchant_id");
--> statement-breakpoint
CREATE INDEX "followed_merchants_user_idx" ON "followed_merchants" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE "saved_products" ALTER COLUMN "device_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "saved_products" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "saved_products" ADD CONSTRAINT "saved_products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "saved_products_user_product_idx" ON "saved_products" USING btree ("user_id","product_id");
--> statement-breakpoint
CREATE INDEX "saved_products_user_idx" ON "saved_products" USING btree ("user_id");
