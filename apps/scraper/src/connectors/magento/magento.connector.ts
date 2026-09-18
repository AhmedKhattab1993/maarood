/**
 * Magento GraphQL connector — GET https://{domain}/graphql?query=...
 *
 * Mobaco moved off WooCommerce Store API (those URLs now return Nuxt HTML).
 * The live catalog is Magento GraphQL. POST /graphql is rejected; GET works.
 */

import type { MerchantConnector, ConnectorContext } from '../types';
import { fetchMerchantJson } from '../http';
import { magentoProductsResponse } from './magento-source.schema';
import { MAGENTO_PAGE_SIZE, magentoProductsUrl } from './magento.query';
import type { MagentoProduct } from './magento-source.schema';

const INTER_PAGE_DELAY_MS = 500;
const FETCH_TIMEOUT_S = 30;
const MAX_PAGES = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseMagentoProductsPage(json: unknown): {
  items: MagentoProduct[];
  currentPage: number;
  totalPages: number;
} {
  const parsed = magentoProductsResponse.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Magento GraphQL response did not match expected shape: ${parsed.error.message}`);
  }
  if (parsed.data.errors?.length) {
    throw new Error(`Magento GraphQL error: ${parsed.data.errors.map((e) => e.message).join('; ')}`);
  }
  const products = parsed.data.data?.products;
  if (!products) {
    throw new Error('Magento GraphQL response missing data.products');
  }
  const currentPage = products.page_info?.current_page ?? 1;
  const totalPages = products.page_info?.total_pages ?? 1;
  return { items: products.items, currentPage, totalPages };
}

export class MagentoConnector implements MerchantConnector {
  constructor(private readonly ctx: ConnectorContext) {}

  async fetchRawProducts(): Promise<unknown[]> {
    const all: unknown[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const url = magentoProductsUrl(this.ctx.domain, page, MAGENTO_PAGE_SIZE);
      if (url.includes('/wp-json/') || url.includes('wc/store')) {
        throw new Error(`Magento connector built a Woo Store API URL: ${url}`);
      }

      let json: unknown;
      try {
        json = await fetchMerchantJson(url, FETCH_TIMEOUT_S);
      } catch (err) {
        throw new Error(
          `Magento GraphQL fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      const { items, totalPages } = parseMagentoProductsPage(json);
      if (items.length === 0) break;
      all.push(...items);
      if (page >= totalPages) break;
      page += 1;
      await sleep(INTER_PAGE_DELAY_MS);
    }

    return all;
  }
}
