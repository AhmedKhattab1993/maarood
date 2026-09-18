/**
 * Merchant registration list used by `seed.ts`.
 * Exported so tests can assert the catalog without running the seed side-effect.
 */

export interface InitialMerchant {
  name: string;
  slug: string;
  domain: string;
  connectorType: string;
  crawlFrequencyMinutes: number;
}

const LOCAL_CRAWL_MINUTES = 360;

export const INITIAL_MERCHANTS: readonly InitialMerchant[] = [
  { name: 'NAS Trends', slug: 'nastrends', domain: 'nastrends.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Antikka', slug: 'antikka', domain: 'antikkaeg.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Mobaco', slug: 'mobaco', domain: 'mobaco.com', connectorType: 'magento', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Y Studios', slug: 'ystudios', domain: 'ystudios.net', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'OMAI', slug: 'omai', domain: 'omaiapparel.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: "Kassem's Hijab", slug: 'kassemshijab', domain: 'kassemshijab.com', connectorType: 'woocommerce', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'NOTFOUND', slug: 'notfound', domain: 'notfoundco.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Baynoire', slug: 'baynoire', domain: 'baynoire.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Sole22', slug: 'sole22', domain: 'sole22.co', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'In Your Shoe (IYS)', slug: 'inyourshoe', domain: 'inyourshoe.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Saqhoute', slug: 'saqhoute', domain: 'saqhoute.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Snuggs Egypt', slug: 'snuggsegypt', domain: 'snuggsegypt.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Palma', slug: 'palma', domain: 'getpalma.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
  { name: 'Sigma Fit', slug: 'sigmafit', domain: 'sigmafiteg.com', connectorType: 'shopify', crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES },
];
