/**
 * TRAPHOUSE connector — public Supabase REST catalog.
 *
 * The static storefront is not Shopify/Woo/Magento. Products are loaded from
 * `products` via the anon key published in `/supabase-config.js`.
 */

import type { MerchantConnector, ConnectorContext } from '../types';
import { fetchMerchantJson, fetchMerchantText } from '../http';
import { traphouseProductsResponse } from './traphouse-source.schema';
import type { TraphouseProduct } from './traphouse-source.schema';
import {
  parseSupabaseConfig,
  supabaseProductsUrl,
  supabaseRestHeaders,
  traphouseConfigUrl,
} from './traphouse.query';

const FETCH_TIMEOUT_S = 30;

export function parseTraphouseProducts(json: unknown): TraphouseProduct[] {
  const parsed = traphouseProductsResponse.safeParse(json);
  if (!parsed.success) {
    throw new Error(`TRAPHOUSE products response did not match expected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

export class TraphouseConnector implements MerchantConnector {
  constructor(private readonly ctx: ConnectorContext) {}

  async fetchRawProducts(): Promise<unknown[]> {
    const configUrl = traphouseConfigUrl(this.ctx.domain);
    let configJs: string;
    try {
      configJs = await fetchMerchantText(configUrl, FETCH_TIMEOUT_S);
    } catch (err) {
      throw new Error(
        `TRAPHOUSE config fetch failed for ${configUrl}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const { url, anonKey } = parseSupabaseConfig(configJs);
    const productsUrl = supabaseProductsUrl(url);
    let json: unknown;
    try {
      json = await fetchMerchantJson(productsUrl, FETCH_TIMEOUT_S, supabaseRestHeaders(anonKey));
    } catch (err) {
      throw new Error(
        `TRAPHOUSE catalog fetch failed for ${productsUrl}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return parseTraphouseProducts(json);
  }
}
