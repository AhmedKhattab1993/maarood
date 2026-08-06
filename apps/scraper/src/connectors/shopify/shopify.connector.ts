/**
 * Shopify connector — fetches products from a store's public /products.json.
 *
 * Shopify exposes a stable JSON API at {domain}/products.json?page=N. This is
 * retrieval priority #2 (structured JSON) per 07_SCRAPING_AND_CATALOG_INGESTION.md,
 * preferred over HTML scraping (Cheerio) or browser rendering (Playwright).
 *
 * Fetching is done via `curl` rather than Node's built-in `fetch`: many Shopify
 * stores sit behind Cloudflare, which fingerprints Node's TLS stack and serves
 * it a sanitized feed (e.g. discounts stripped, prices altered) — losing real
 * merchant data. curl's TLS fingerprint is not flagged, so it receives the true
 * product payload. Covers any Shopify store; no per-store customization needed.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { MerchantConnector, ConnectorContext } from '../types';
import { shopifyProductsResponse } from './shopify-source.schema';

const execFileAsync = promisify(execFile);

const PAGE_SIZE = 250; // Shopify max per page.
const INTER_PAGE_DELAY_MS = 500; // Be polite; avoid hammering the store.
const FETCH_TIMEOUT_S = 30;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch a URL via curl (bypasses Cloudflare's Node-TLS-fingerprint blocking). */
async function curlJson(url: string): Promise<unknown> {
  const { stdout } = await execFileAsync(
    'curl',
    [
      '-sS',
      '--fail',
      '--max-time',
      String(FETCH_TIMEOUT_S),
      '-H',
      'accept: application/json',
      '-A',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      url,
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(stdout);
}

export class ShopifyConnector implements MerchantConnector {
  constructor(private readonly ctx: ConnectorContext) {}

  async fetchRawProducts(): Promise<unknown[]> {
    const all: unknown[] = [];
    let page = 1;

    while (true) {
      const url = `https://${this.ctx.domain}/products.json?limit=${PAGE_SIZE}&page=${page}`;

      let json: unknown;
      try {
        json = await curlJson(url);
      } catch (err) {
        throw new Error(`Shopify fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`);
      }

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
