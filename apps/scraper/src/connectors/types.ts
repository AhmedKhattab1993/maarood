/**
 * Connector contract. Each merchant's connector retrieves raw product records
 * in that merchant's native shape; the shared pipeline handles validation,
 * change detection, and storage.
 *
 * A connector isolates store-specific extraction from the core pipeline,
 * per the locked connector architecture in 07_SCRAPING_AND_CATALOG_INGESTION.md.
 */

import type { Product } from '@maarood/schema';

/** Canonical product plus its material-change checksum (computed by the normalizer). */
export interface NormalizedProduct extends Product {
  sourceChecksum: string;
}

export interface MerchantConnector {
  /**
   * Fetch all raw product records for this merchant.
   * Implementations paginate and rate-limit as needed.
   * Returns the merchant-native payload — not yet validated or normalized.
   */
  fetchRawProducts(): Promise<unknown[]>;
}

export interface ConnectorContext {
  merchantId: string;
  domain: string;
}

/** Connector factory keyed by merchants.connector_type. */
export type ConnectorFactory = (ctx: ConnectorContext) => MerchantConnector;

/** Normalize a raw merchant product record into the canonical Maaroud shape. */
export type RawNormalizer = (
  raw: unknown,
  merchantId: string,
  domain: string,
) => NormalizedProduct;

/**
 * Everything the pipeline needs for one connector type: how to fetch, how to
 * normalize, and a provenance tag for raw_snapshots. Adding a new store is a
 * matter of registering one entry here.
 */
export interface ConnectorDefinition {
  factory: ConnectorFactory;
  normalize: RawNormalizer;
  /** Provenance tag stored on raw_snapshots, e.g. 'shopify_json'. */
  sourceType: string;
}
