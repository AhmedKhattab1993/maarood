/**
 * Material-change checksum. Hashes only the fields listed in
 * MATERIAL_CHANGE_FIELDS, so unchanged re-crawls don't create spurious
 * revisions from timestamp drift or non-material metadata.
 */

import { createHash } from 'node:crypto';
import { MATERIAL_CHANGE_FIELDS, type Product } from '@maarood/schema';

export function materialChecksum(product: Pick<Product, (typeof MATERIAL_CHANGE_FIELDS)[number]>): string {
  // Deterministic JSON: sorted keys, stable ordering of array elements is the
  // caller's responsibility (normalization produces canonical ordering).
  const payload = JSON.stringify(product, MATERIAL_CHANGE_FIELDS as unknown as (keyof Product)[]);
  return createHash('sha256').update(payload).digest('hex');
}
