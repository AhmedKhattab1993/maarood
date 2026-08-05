/**
 * Connector contract. Each merchant's connector retrieves raw product records
 * in that merchant's native shape; the shared pipeline handles validation,
 * normalization, change detection, and storage.
 *
 * A connector isolates store-specific extraction from the core pipeline,
 * per the locked connector architecture in 07_SCRAPING_AND_CATALOG_INGESTION.md.
 */

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
