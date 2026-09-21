-- Redefine search_vector with Arabic letter + diacritic folding so indexed
-- Arabic text matches the JS-normalized query side (v1/search/normalize.ts:
-- أإآ→ا, ى→ي, ة→ه, diacritics/tatweel stripped). The query normalizer already
-- folds, but the index did not — Arabic queries missed inflected forms.
-- A GENERATED column cannot be altered in place, so drop and re-add it.

DROP INDEX IF EXISTS "products_search_vector_idx";--> statement-breakpoint

ALTER TABLE "products" DROP COLUMN IF EXISTS "search_vector";--> statement-breakpoint

ALTER TABLE "products" ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      translate(
        coalesce("title", '') || ' ' ||
        coalesce("description", '') || ' ' ||
        coalesce("category", '') || ' ' ||
        coalesce("subcategory", '') || ' ' ||
        coalesce("merchant_product_id", ''),
        'أإآىةًٌٍَُِّْٰـؚٗ٘ٙ',
        'ااايهو'
      )
    )
  ) STORED;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING gin ("search_vector");
