/**
 * Zammit connector — public storefront JSON via api/v2/products/fast.
 *
 * Shopify `/products.json` and Woo Store API are HTML/401 on Zammit shops.
 * The Next storefront hydrates from this JSON (domain header + shop_query).
 */

import type { MerchantConnector, ConnectorContext } from '../types';
import { fetchMerchantJson, fetchMerchantText } from '../http';
import { zammitProductsResponse } from './zammit-source.schema';
import type { ZammitProduct } from './zammit-source.schema';
import {
  ZAMMIT_API_HOST,
  ZAMMIT_PAGE_SIZE,
  parseZammitApiHost,
  zammitHost,
  zammitProductsUrl,
  zammitStorefrontHeaders,
} from './zammit.query';

const INTER_PAGE_DELAY_MS = 500;
const FETCH_TIMEOUT_S = 30;
const MAX_PAGES = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseZammitProductsPage(json: unknown): {
  products: ZammitProduct[];
  currentPage: number;
  totalPages: number;
} {
  const parsed = zammitProductsResponse.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Zammit products response did not match expected shape: ${parsed.error.message}`);
  }
  if (parsed.data.success === false) {
    throw new Error('Zammit products response success=false');
  }
  const products = parsed.data.data.products;
  const meta = parsed.data.data.metadata;
  return {
    products,
    currentPage: meta?.currentPage ?? 1,
    totalPages: meta?.totalPages ?? 1,
  };
}

export class ZammitConnector implements MerchantConnector {
  constructor(private readonly ctx: ConnectorContext) {}

  async fetchRawProducts(): Promise<unknown[]> {
    const apiHost = await this.discoverApiHost();
    const headers = zammitStorefrontHeaders(this.ctx.domain);
    const all: unknown[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const url = zammitProductsUrl(apiHost, page, ZAMMIT_PAGE_SIZE);
      let json: unknown;
      try {
        json = await fetchMerchantJson(url, FETCH_TIMEOUT_S, headers);
      } catch (err) {
        throw new Error(
          `Zammit fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      const { products, totalPages } = parseZammitProductsPage(json);
      if (products.length === 0) break;
      all.push(...products);
      if (page >= totalPages) break;
      page += 1;
      await sleep(INTER_PAGE_DELAY_MS);
    }

    return all;
  }

  private async discoverApiHost(): Promise<string> {
    const origin = `https://${zammitHost(this.ctx.domain)}`;
    try {
      const html = await fetchMerchantText(`${origin}/en/shop`, FETCH_TIMEOUT_S);
      return parseZammitApiHost(html);
    } catch {
      return ZAMMIT_API_HOST;
    }
  }
}
