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

const FIFTY_NINE_NEW_BRANDS = [
  { name: 'Bewilen', domain: 'bewilen.com', connectorType: 'shopify' },
  { name: 'AJA', domain: 'aja-eg.com', connectorType: 'shopify' },
  { name: 'Egy Wear', domain: 'egywear-eg.com', connectorType: 'shopify' },
  { name: 'SUY', domain: 'suystore.com', connectorType: 'zammit' },
  { name: 'BLNCO', domain: 'blncoeg.com', connectorType: 'shopify' },
  { name: 'Jasper Studios', domain: 'jasper-eg.com', connectorType: 'shopify' },
  { name: 'Konga', domain: 'kongaeg.com', connectorType: 'shopify' },
  { name: 'Suna The Label', domain: 'sunathelabel.com', connectorType: 'shopify' },
  { name: 'CFS Studios', domain: 'cfsstudios.fit', connectorType: 'shopify' },
  { name: 'MYNE', domain: 'mynethelabel.co', connectorType: 'shopify' },
  { name: 'GEBA', domain: 'gebaaa.com', connectorType: 'shopify' },
  { name: 'ENN Babies Wear', domain: 'ennbabieswear.com', connectorType: 'shopify' },
  { name: 'Museik', domain: 'museikworld.com', connectorType: 'shopify' },
  { name: 'DEEB DESIGNS', domain: 'deebdesignseg.com', connectorType: 'shopify' },
  { name: 'ALBER', domain: 'alber.world', connectorType: 'shopify' },
  { name: 'Crunk', domain: 'crunk-eg.com', connectorType: 'woocommerce' },
  { name: 'The MD', domain: 'themd.com', connectorType: 'shopify' },
  { name: 'Steelixe', domain: 'steelixe.com', connectorType: 'shopify' },
  { name: 'Nehal Elhady Jewellery', domain: 'nehalelhadyjewellery.com', connectorType: 'shopify' },
  { name: 'De Baz', domain: 'debazeg.com', connectorType: 'shopify' },
  { name: 'Nileton', domain: 'nileton.com', connectorType: 'woocommerce' },
  { name: 'ENJAY', domain: 'enjaywears.com', connectorType: 'shopify' },
  { name: 'Rigash', domain: 'rigash.com', connectorType: 'shopify' },
  { name: 'Katjie', domain: 'katjie.com', connectorType: 'woocommerce' },
  { name: 'Dangles', domain: 'dangles-eg.com', connectorType: 'shopify' },
  { name: 'Rebel Cairo', domain: 'rebelcairo.com', connectorType: 'shopify' },
  { name: 'Bezravoga', domain: 'bezravoga-eg.com', connectorType: 'shopify' },
  { name: 'Nawara', domain: 'shopnawaraa.com', connectorType: 'shopify' },
  { name: 'Glitch Goods', domain: 'glitchgoods.shop', connectorType: 'shopify' },
  { name: 'FUFA', domain: 'shopfufa.com', connectorType: 'shopify' },
  { name: 'DSTRCT', domain: 'dstrct-eg.com', connectorType: 'shopify' },
  { name: 'Leocansa', domain: 'leocansa.com', connectorType: 'shopify' },
  { name: 'Emalina', domain: 'emalinafashion.com', connectorType: 'shopify' },
  { name: 'Be-Indie', domain: 'be-indie.com', connectorType: 'shopify' },
  { name: 'Suit Yourself', domain: 'suityour-self.com', connectorType: 'shopify' },
  { name: 'TRAPHOUSE', domain: 'traphouse.ltd', connectorType: 'traphouse' },
  { name: 'Tema', domain: 'tema-eg.com', connectorType: 'shopify' },
  { name: 'NASEEG', domain: 'naseeg.eg', connectorType: 'shopify' },
  { name: 'Caza Meeza', domain: 'cazameeza.com', connectorType: 'shopify' },
  { name: 'Adaan', domain: 'adaaneg.com', connectorType: 'shopify' },
  { name: 'OUTMUDE', domain: 'outmude.com', connectorType: 'shopify' },
  { name: 'Print n Go', domain: 'printngo.me', connectorType: 'shopify' },
  { name: 'Athlete Home', domain: 'athletehome-eg.com', connectorType: 'shopify' },
  { name: 'Fashion Pyramid', domain: 'fashionpyramid.co', connectorType: 'shopify' },
  { name: 'LABOGA', domain: 'shoplaboga.com', connectorType: 'shopify' },
  { name: 'Ozmo Collection', domain: 'ozmocollection.com', connectorType: 'shopify' },
  { name: 'Denjo', domain: 'denjo.co', connectorType: 'shopify' },
  { name: 'Le Maillot', domain: 'lemaillot-eg.com', connectorType: 'shopify' },
  { name: 'RAMLA', domain: 'ramlastore.com', connectorType: 'shopify' },
  { name: 'ALIEL', domain: 'alielofficial.com', connectorType: 'shopify' },
  { name: 'Farah Seif', domain: 'farahseif.com', connectorType: 'shopify' },
  { name: 'MAGMA', domain: 'magmasportswear.com', connectorType: 'shopify' },
  { name: 'Camicie', domain: 'camicie-eg.com', connectorType: 'shopify' },
  { name: 'Emeli', domain: 'emeliegypt.com', connectorType: 'shopify' },
  { name: 'Pepla', domain: 'pepla.store', connectorType: 'shopify' },
  { name: 'Swijabi', domain: 'swijabi.com', connectorType: 'shopify' },
  { name: 'Libra Sports', domain: 'libra-sportswear.com', connectorType: 'shopify' },
  { name: 'Up-Fuse', domain: 'up-fuse.com', connectorType: 'shopify' },
  { name: 'UNTY', domain: 'unty.co', connectorType: 'shopify' },
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

  it('registers the 59 listed brands once each with a shipped connector', () => {
    expect(FIFTY_NINE_NEW_BRANDS).toHaveLength(59);
    expect(new Set(FIFTY_NINE_NEW_BRANDS.map((b) => b.domain)).size).toBe(59);
    expect(INITIAL_MERCHANTS.filter((m) => m.domain === 'aja-eg.com')).toHaveLength(1);

    for (const want of FIFTY_NINE_NEW_BRANDS) {
      const found = INITIAL_MERCHANTS.find((m) => m.domain === want.domain);
      expect(found, want.domain).toBeDefined();
      expect(found!.name).toBe(want.name);
      expect(found!.domain).toBe(want.domain);
      expect(found!.domain).not.toMatch(/^www\./);
      expect(found!.domain).not.toMatch(/^https?:/i);
      expect(found!.connectorType).toBe(want.connectorType);
      expect(found!.slug.length).toBeGreaterThan(0);
      expect(connectors[found!.connectorType], found!.connectorType).toBeDefined();
    }
  });

  it('keeps the previous 14 merchants registered and not replaced', () => {
    const previous = [...EXISTING_BRANDS, ...TEN_NEW_BRANDS];
    expect(previous).toHaveLength(14);
    for (const want of previous) {
      const found = INITIAL_MERCHANTS.find((m) => m.domain === want.domain);
      expect(found, want.domain).toBeDefined();
      expect(found!.name).toBe(want.name);
      expect(found!.connectorType).toBe(want.connectorType);
      expect(found!.slug.length).toBeGreaterThan(0);
    }
  });
});
