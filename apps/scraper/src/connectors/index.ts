/** Connector registry — maps merchants.connector_type to its factory. */

import type { ConnectorFactory } from './types';
import { ShopifyConnector } from './shopify/shopify.connector';

export const connectors: Record<string, ConnectorFactory> = {
  shopify: (ctx) => new ShopifyConnector(ctx),
};
