/** Connector registry — maps merchants.connector_type to its definition. */

import type { ConnectorDefinition } from './types';
import { ShopifyConnector } from './shopify/shopify.connector';
import { normalizeShopifyProduct } from './shopify/shopify.normalizer';
import { WooCommerceConnector } from './woocommerce/woocommerce.connector';
import { normalizeWooCommerceProduct } from './woocommerce/woocommerce.normalizer';
import { MagentoConnector } from './magento/magento.connector';
import { normalizeMagentoProduct } from './magento/magento.normalizer';
import { ZammitConnector } from './zammit/zammit.connector';
import { normalizeZammitProduct } from './zammit/zammit.normalizer';
import { TraphouseConnector } from './traphouse/traphouse.connector';
import { normalizeTraphouseProduct } from './traphouse/traphouse.normalizer';

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
  magento: {
    factory: (ctx) => new MagentoConnector(ctx),
    normalize: normalizeMagentoProduct,
    sourceType: 'magento_graphql',
  },
  zammit: {
    factory: (ctx) => new ZammitConnector(ctx),
    normalize: normalizeZammitProduct,
    sourceType: 'zammit_json',
  },
  traphouse: {
    factory: (ctx) => new TraphouseConnector(ctx),
    normalize: normalizeTraphouseProduct,
    sourceType: 'traphouse_supabase',
  },
};
