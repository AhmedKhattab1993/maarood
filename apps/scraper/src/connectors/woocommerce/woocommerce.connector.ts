/**
 * WooCommerce connector — fetches products from a store's public Store API.
 *
 * Endpoint: {domain}/wp-json/wc/store/v1/products?per_page=100&page=N
 * No authentication required; returns a bare JSON array per page.
 *
 * Fetching goes through the shared connector HTTP helper (curl-first with a
 * Node-fetch fallback — see connectors/http.ts): Mobaco sits behind Cloudflare,
 * which fingerprints Node's TLS stack. curl's TLS fingerprint receives the
 * true product payload.
 */

import type { MerchantConnector, ConnectorContext } from '../types';
import { fetchMerchantJson } from '../http';
import { wooProductsResponse } from './woocommerce-source.schema';

const PAGE_SIZE = 100; // WooCommerce Store API caps per_page at 100.
const INTER_PAGE_DELAY_MS = 500; // Be polite; avoid hammering the store.
const FETCH_TIMEOUT_S = 30;
const MAX_PAGES = 200; // safety guard against a misbehaving pagination loop.

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseWooCommercePage(json: unknown): ReturnType<typeof wooProductsResponse.parse> {
  const parsed = wooProductsResponse.safeParse(json);
  if (!parsed.success) {
    throw new Error(`WooCommerce response did not match expected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

export class WooCommerceConnector implements MerchantConnector {
  constructor(private readonly ctx: ConnectorContext) {}

  async fetchRawProducts(): Promise<unknown[]> {
    const all: unknown[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const url = `https://${this.ctx.domain}/wp-json/wc/store/v1/products?per_page=${PAGE_SIZE}&page=${page}`;

      let json: unknown;
      try {
        json = await fetchMerchantJson(url, FETCH_TIMEOUT_S);
      } catch (err) {
        throw new Error(
          `WooCommerce fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      let parsed;
      try {
        parsed = parseWooCommercePage(json);
      } catch (err) {
        throw new Error(
          `WooCommerce response did not match expected shape on page ${page}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      if (parsed.length === 0) break; // no more pages

      all.push(...parsed);

      if (parsed.length < PAGE_SIZE) break; // last page

      page += 1;
      await sleep(INTER_PAGE_DELAY_MS);
    }

    return all;
  }
}
