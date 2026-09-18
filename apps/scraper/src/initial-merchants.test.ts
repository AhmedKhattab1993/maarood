import { describe, expect, it } from 'vitest';
import { connectors } from './connectors';
import { INITIAL_MERCHANTS } from './initial-merchants';

const TEN_NEW_BRANDS = [
  { name: 'OMAI', domain: 'omaiapparel.com', connectorType: 'shopify' },
  { name: "Kassem's Hijab", domain: 'kassemshijab.com', connectorType: 'woocommerce' },
  { name: 'NOTFOUND', domain: 'notfoundco.com', connectorType: 'shopify' },
  { name: 'Baynoire', domain: 'baynoire.com', connectorType: 'shopify' },
  { name: 'Sole22', domain: 'sole22.co', connectorType: 'shopify' },
  { name: 'In Your Shoe (IYS)', domain: 'inyourshoe.com', connectorType: 'shopify' },
  { name: 'Saqhoute', domain: 'saqhoute.com', connectorType: 'shopify' },
  { name: 'Snuggs Egypt', domain: 'snuggsegypt.com', connectorType: 'shopify' },
  { name: 'Palma', domain: 'getpalma.com', connectorType: 'shopify' },
  { name: 'Sigma Fit', domain: 'sigmafiteg.com', connectorType: 'shopify' },
] as const;

const EXISTING_BRANDS = [
  { name: 'NAS Trends', domain: 'nastrends.com', connectorType: 'shopify' },
  { name: 'Antikka', domain: 'antikkaeg.com', connectorType: 'shopify' },
  { name: 'Mobaco', domain: 'mobaco.com', connectorType: 'magento' },
  { name: 'Y Studios', domain: 'ystudios.net', connectorType: 'shopify' },
] as const;

describe('INITIAL_MERCHANTS', () => {
  it('registers the ten listed brands with implemented JSON connectors', () => {
    for (const want of TEN_NEW_BRANDS) {
      const found = INITIAL_MERCHANTS.find((m) => m.domain === want.domain);
      expect(found, want.domain).toBeDefined();
      expect(found!.name).toBe(want.name);
      expect(found!.connectorType).toBe(want.connectorType);
      expect(found!.slug.length).toBeGreaterThan(0);
      expect(connectors[found!.connectorType], found!.connectorType).toBeDefined();
    }
  });

  it('keeps the original four merchants registered', () => {
    for (const want of EXISTING_BRANDS) {
      const found = INITIAL_MERCHANTS.find((m) => m.domain === want.domain);
      expect(found, want.domain).toBeDefined();
      expect(found!.name).toBe(want.name);
      expect(found!.connectorType).toBe(want.connectorType);
    }
  });
});
