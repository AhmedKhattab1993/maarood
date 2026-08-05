/**
 * Shopify connector — fetches products from a store's public /products.json.
 *
 * Shopify exposes a stable JSON API at {domain}/products.json?page=N. This is
 * retrieval priority #2 (structured JSON) per 07_SCRAPING_AND_CATALOG_INGESTION.md,
 * preferred over HTML scraping (Cheerio) or browser rendering (Playwright).
 *
 * Covers any Shopify store; no per-store customization needed beyond the domain.
 */

import type { MerchantConnector, ConnectorContext } from '../types';
import { shopifyProductsResponse } from './shopify-source.schema';

const PAGE_SIZE = 250; // Shopify max per page.
const INTER_PAGE_DELAY_MS = 500; // Be polite; avoid hammering the store.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ShopifyConnector implements MerchantConnector {
  constructor(private readonly ctx: ConnectorContext) {}

  async fetchRawProducts(): Promise<unknown[]> {
    const all: unknown[] = [];
    let page = 1;

    while (true) {
      const url = `https://${this.ctx.domain}/products.json?limit=${PAGE_SIZE}&page=${page}`;
      const res = await fetch(url, {
        headers: { accept: 'application/json', 'user-agent': 'maarood-ingestion/0.1 (+https://maarood.com)' },
      });

      if (!res.ok) {
        throw new Error(`Shopify fetch failed for ${url}: HTTP ${res.status}`);
      }

      const json = await res.json();
      const parsed = shopifyProductsResponse.safeParse(json);
      if (!parsed.success) {
        throw new Error(
          `Shopify response did not match expected shape on page ${page}: ${parsed.error.message}`,
        );
      }

      const batch = parsed.data.products;
      if (batch.length === 0) break; // no more pages

      all.push(...batch);
      if (batch.length < PAGE_SIZE) break; // last page

      page += 1;
      await sleep(INTER_PAGE_DELAY_MS);
    }

    return all;
  }
}
