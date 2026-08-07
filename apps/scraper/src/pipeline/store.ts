/**
 * Storage stage — persists a normalized product, detecting material changes
 * and appending to product_revisions only when something actually changed.
 *
 * Behavior keyed on (merchantId, merchantProductId):
 *   - not present: insert products (revision_number=1) + append revision #1
 *   - present, checksum unchanged: bump only last_seen_at
 *   - present, checksum changed: update products, bump revision_number,
 *     append a new revision row with the new values
 *
 * This preserves the full version history while keeping `products` as the
 * fast current-state view.
 */

import { and, eq } from 'drizzle-orm';
import {
  products,
  productRevisions,
  rawSnapshots,
  type NewRawSnapshotRow,
} from '@maarood/schema';
import type { ScraperDb } from '../db';
import type { NormalizedProduct } from '../connectors/types';

export type StoreOutcome = 'inserted' | 'changed' | 'unchanged';

/** Stringify JSON columns the same way the schema stores them (text columns). */
function asJsonText(value: unknown): string {
  return JSON.stringify(value ?? []);
}

export interface StoreResult {
  outcome: StoreOutcome;
  productId: string;
}

export async function storeProduct(
  db: ScraperDb,
  crawlRunId: string,
  normalized: NormalizedProduct,
  sourceType: string,
): Promise<StoreResult> {
  const existing = await db
    .select({
      id: products.id,
      checksum: products.sourceChecksum,
      revision: products.revisionNumber,
      staleAt: products.staleAt,
    })
    .from(products)
    .where(
      and(
        eq(products.merchantId, normalized.merchantId),
        eq(products.merchantProductId, normalized.merchantProductId),
      ),
    )
    .limit(1);

  const now = new Date();

  // Always write a raw snapshot for debugging/reprocessing.
  const snapshot: NewRawSnapshotRow = {
    merchantId: normalized.merchantId,
    merchantProductId: normalized.merchantProductId,
    rawPayload: normalized as unknown as Record<string, unknown>,
    sourceType,
    checksum: normalized.sourceChecksum,
  };
  await db.insert(rawSnapshots).values(snapshot);

  if (existing.length === 0) {
    // New product.
    const [inserted] = await db
      .insert(products)
      .values({
        merchantId: normalized.merchantId,
        sourceUrl: normalized.sourceUrl,
        merchantProductId: normalized.merchantProductId,
        title: normalized.title,
        description: normalized.description,
        vendor: normalized.vendor,
        category: normalized.category,
        subcategory: normalized.subcategory,
        currentPrice: normalized.currentPrice.toFixed(2),
        previousPrice: normalized.previousPrice !== null ? normalized.previousPrice.toFixed(2) : null,
        currency: normalized.currency,
        availability: normalized.availability,
        variants: asJsonText(normalized.variants),
        options: asJsonText(normalized.options),
        sizes: asJsonText(normalized.sizes),
        colors: asJsonText(normalized.colors),
        imageUrls: asJsonText(normalized.imageUrls),
        redirectUrl: normalized.redirectUrl,
        sourceChecksum: normalized.sourceChecksum,
        revisionNumber: 1,
        lastSeenAt: now,
        lastUpdatedAt: now,
      })
      .returning({ id: products.id });

    await db.insert(productRevisions).values({
      productId: inserted!.id,
      revisionNumber: 1,
      sourceUrl: normalized.sourceUrl,
      merchantProductId: normalized.merchantProductId,
      title: normalized.title,
      description: normalized.description,
      vendor: normalized.vendor,
      category: normalized.category,
      subcategory: normalized.subcategory,
      currentPrice: normalized.currentPrice.toFixed(2),
      previousPrice: normalized.previousPrice !== null ? normalized.previousPrice.toFixed(2) : null,
      currency: normalized.currency,
      availability: normalized.availability,
      variants: asJsonText(normalized.variants),
      options: asJsonText(normalized.options),
      sizes: asJsonText(normalized.sizes),
      colors: asJsonText(normalized.colors),
      imageUrls: asJsonText(normalized.imageUrls),
      redirectUrl: normalized.redirectUrl,
      sourceChecksum: normalized.sourceChecksum,
      crawlRunId,
      changedAt: now,
    });

    return { outcome: 'inserted', productId: inserted!.id };
  }

  const row = existing[0]!;
  if (row.checksum === normalized.sourceChecksum) {
    // Unchanged — bump only last_seen_at. No revision.
    // If the product was stale (reappeared after going missing), restore it.
    const restore = row.staleAt !== null
      ? { lastSeenAt: now, staleAt: null, availability: normalized.availability }
      : { lastSeenAt: now };
    await db.update(products).set(restore).where(eq(products.id, row.id));
    return { outcome: 'unchanged', productId: row.id };
  }

  // Material change — update current state, append a new revision.
  const nextRevision = row.revision + 1;
  await db
    .update(products)
    .set({
      sourceUrl: normalized.sourceUrl,
      merchantProductId: normalized.merchantProductId,
      title: normalized.title,
      description: normalized.description,
      vendor: normalized.vendor,
      category: normalized.category,
      subcategory: normalized.subcategory,
      currentPrice: normalized.currentPrice.toFixed(2),
      previousPrice: normalized.previousPrice !== null ? normalized.previousPrice.toFixed(2) : null,
      currency: normalized.currency,
      availability: normalized.availability,
      variants: asJsonText(normalized.variants),
      options: asJsonText(normalized.options),
      sizes: asJsonText(normalized.sizes),
      colors: asJsonText(normalized.colors),
      imageUrls: asJsonText(normalized.imageUrls),
      redirectUrl: normalized.redirectUrl,
      sourceChecksum: normalized.sourceChecksum,
      revisionNumber: nextRevision,
      lastSeenAt: now,
      lastUpdatedAt: now,
      staleAt: null, // a material change means the product is back / current
    })
    .where(eq(products.id, row.id));

  await db.insert(productRevisions).values({
    productId: row.id,
    revisionNumber: nextRevision,
    sourceUrl: normalized.sourceUrl,
    merchantProductId: normalized.merchantProductId,
    title: normalized.title,
    description: normalized.description,
    vendor: normalized.vendor,
    category: normalized.category,
    subcategory: normalized.subcategory,
    currentPrice: normalized.currentPrice.toFixed(2),
    previousPrice: normalized.previousPrice !== null ? normalized.previousPrice.toFixed(2) : null,
    currency: normalized.currency,
    availability: normalized.availability,
    variants: asJsonText(normalized.variants),
    options: asJsonText(normalized.options),
    sizes: asJsonText(normalized.sizes),
    colors: asJsonText(normalized.colors),
    imageUrls: asJsonText(normalized.imageUrls),
    redirectUrl: normalized.redirectUrl,
    sourceChecksum: normalized.sourceChecksum,
    crawlRunId,
    changedAt: now,
  });

  return { outcome: 'changed', productId: row.id };
}
