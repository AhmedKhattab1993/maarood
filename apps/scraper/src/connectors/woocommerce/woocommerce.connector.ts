/**
 * WooCommerce connector — fetches products from a store's public Store API.
 *
 * Endpoint: {domain}/wp-json/wc/store/v1/products?per_page=100&page=N
 * No authentication required; returns a bare JSON array per page.
 *
 * Fetching goes through `curl` (same as the Shopify connector): Mobaco sits
 * behind Cloudflare, which fingerprints Node's TLS stack. curl's TLS
 * fingerprint receives the true product payload.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { MerchantConnector, ConnectorContext } from '../types';
import { wooProduct } from './woocommerce-source.schema';

const execFileAsync = promisify(execFile);

const PAGE_SIZE = 100; // WooCommerce Store API caps per_page at 100.
const INTER_PAGE_DELAY_MS = 500; // Be polite; avoid hammering the store.
const FETCH_TIMEOUT_S = 30;
const MAX_PAGES = 200; // safety guard against a misbehaving pagination loop.

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

const pageResponse = z.array(wooProduct);

export class WooCommerceConnector implements MerchantConnector {
  constructor(private readonly ctx: ConnectorContext) {}

  async fetchRawProducts(): Promise<unknown[]> {
    const all: unknown[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const url = `https://${this.ctx.domain}/wp-json/wc/store/v1/products?per_page=${PAGE_SIZE}&page=${page}`;

      let json: unknown;
      try {
        json = await curlJson(url);
      } catch (err) {
        throw new Error(
          `WooCommerce fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      const parsed = pageResponse.safeParse(json);
      if (!parsed.success) {
        throw new Error(
          `WooCommerce response did not match expected shape on page ${page}: ${parsed.error.message}`,
        );
      }

      if (parsed.data.length === 0) break; // no more pages

      all.push(...parsed.data);

      if (parsed.data.length < PAGE_SIZE) break; // last page

      page += 1;
      await sleep(INTER_PAGE_DELAY_MS);
    }

    return all;
  }
}
