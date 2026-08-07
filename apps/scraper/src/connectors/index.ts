/** Connector registry — maps merchants.connector_type to its definition. */

import type { ConnectorDefinition } from './types';
import { ShopifyConnector } from './shopify/shopify.connector';
import { normalizeShopifyProduct } from './shopify/shopify.normalizer';
import { WooCommerceConnector } from './woocommerce/woocommerce.connector';
import { normalizeWooCommerceProduct } from './woocommerce/woocommerce.normalizer';

export const connectors: Record<string, ConnectorDefinition> = {
  shopify: {
    factory: (ctx) => new ShopifyConnector(ctx),
    normalize: normalizeShopifyProduct,
    sourceType: 'shopify_json',
  },
  woocommerce: {
    factory: (ctx) => new WooCommerceConnector(ctx),
    normalize: normalizeWooCommerceProduct,
    sourceType: 'woocommerce_store_api',
  },
};
