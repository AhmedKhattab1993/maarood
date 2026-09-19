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

function merchant(
  name: string,
  slug: string,
  domain: string,
  connectorType: string,
): InitialMerchant {
  return { name, slug, domain, connectorType, crawlFrequencyMinutes: LOCAL_CRAWL_MINUTES };
}

export const INITIAL_MERCHANTS: readonly InitialMerchant[] = [
  merchant('NAS Trends', 'nastrends', 'nastrends.com', 'shopify'),
  merchant('Antikka', 'antikka', 'antikkaeg.com', 'shopify'),
  merchant('Mobaco', 'mobaco', 'mobaco.com', 'magento'),
  merchant('Y Studios', 'ystudios', 'ystudios.net', 'shopify'),
  merchant('OMAI', 'omai', 'omaiapparel.com', 'shopify'),
  merchant("Kassem's Hijab", 'kassemshijab', 'kassemshijab.com', 'woocommerce'),
  merchant('NOTFOUND', 'notfound', 'notfoundco.com', 'shopify'),
  merchant('Baynoire', 'baynoire', 'baynoire.com', 'shopify'),
  merchant('Sole22', 'sole22', 'sole22.co', 'shopify'),
  merchant('In Your Shoe (IYS)', 'inyourshoe', 'inyourshoe.com', 'shopify'),
  merchant('Saqhoute', 'saqhoute', 'saqhoute.com', 'shopify'),
  merchant('Snuggs Egypt', 'snuggsegypt', 'snuggsegypt.com', 'shopify'),
  merchant('Palma', 'palma', 'getpalma.com', 'shopify'),
  merchant('Sigma Fit', 'sigmafit', 'sigmafiteg.com', 'shopify'),
  merchant('Bewilen', 'bewilen', 'bewilen.com', 'shopify'),
  merchant('AJA', 'aja', 'aja-eg.com', 'shopify'),
  merchant('Egy Wear', 'egywear', 'egywear-eg.com', 'shopify'),
  merchant('SUY', 'suy', 'suystore.com', 'zammit'),
  merchant('BLNCO', 'blnco', 'blncoeg.com', 'shopify'),
  merchant('Jasper Studios', 'jasper', 'jasper-eg.com', 'shopify'),
  merchant('Konga', 'konga', 'kongaeg.com', 'shopify'),
  merchant('Suna The Label', 'suna', 'sunathelabel.com', 'shopify'),
  merchant('CFS Studios', 'cfsstudios', 'cfsstudios.fit', 'shopify'),
  merchant('MYNE', 'myne', 'mynethelabel.co', 'shopify'),
  merchant('GEBA', 'geba', 'gebaaa.com', 'shopify'),
  merchant('ENN Babies Wear', 'ennbabieswear', 'ennbabieswear.com', 'shopify'),
  merchant('Museik', 'museik', 'museikworld.com', 'shopify'),
  merchant('DEEB DESIGNS', 'deebdesigns', 'deebdesignseg.com', 'shopify'),
  merchant('ALBER', 'alber', 'alber.world', 'shopify'),
  merchant('Crunk', 'crunk', 'crunk-eg.com', 'woocommerce'),
  merchant('The MD', 'themd', 'themd.com', 'shopify'),
  merchant('Steelixe', 'steelixe', 'steelixe.com', 'shopify'),
  merchant('Nehal Elhady Jewellery', 'nehalelhady', 'nehalelhadyjewellery.com', 'shopify'),
  merchant('De Baz', 'debaz', 'debazeg.com', 'shopify'),
  merchant('Nileton', 'nileton', 'nileton.com', 'woocommerce'),
  merchant('ENJAY', 'enjay', 'enjaywears.com', 'shopify'),
  merchant('Rigash', 'rigash', 'rigash.com', 'shopify'),
  merchant('Katjie', 'katjie', 'katjie.com', 'woocommerce'),
  merchant('Dangles', 'dangles', 'dangles-eg.com', 'shopify'),
  merchant('Rebel Cairo', 'rebelcairo', 'rebelcairo.com', 'shopify'),
  merchant('Bezravoga', 'bezravoga', 'bezravoga-eg.com', 'shopify'),
  merchant('Nawara', 'nawara', 'shopnawaraa.com', 'shopify'),
  merchant('Glitch Goods', 'glitchgoods', 'glitchgoods.shop', 'shopify'),
  merchant('FUFA', 'fufa', 'shopfufa.com', 'shopify'),
  merchant('DSTRCT', 'dstrct', 'dstrct-eg.com', 'shopify'),
  merchant('Leocansa', 'leocansa', 'leocansa.com', 'shopify'),
  merchant('Emalina', 'emalina', 'emalinafashion.com', 'shopify'),
  merchant('Be-Indie', 'be-indie', 'be-indie.com', 'shopify'),
  merchant('Suit Yourself', 'suityourself', 'suityour-self.com', 'shopify'),
  merchant('TRAPHOUSE', 'traphouse', 'traphouse.ltd', 'traphouse'),
  merchant('Tema', 'tema', 'tema-eg.com', 'shopify'),
  merchant('NASEEG', 'naseeg', 'naseeg.eg', 'shopify'),
  merchant('Caza Meeza', 'cazameeza', 'cazameeza.com', 'shopify'),
  merchant('Adaan', 'adaan', 'adaaneg.com', 'shopify'),
  merchant('OUTMUDE', 'outmude', 'outmude.com', 'shopify'),
  merchant('Print n Go', 'printngo', 'printngo.me', 'shopify'),
  merchant('Athlete Home', 'athletehome', 'athletehome-eg.com', 'shopify'),
  merchant('Fashion Pyramid', 'fashionpyramid', 'fashionpyramid.co', 'shopify'),
  merchant('LABOGA', 'laboga', 'shoplaboga.com', 'shopify'),
  merchant('Ozmo Collection', 'ozmo', 'ozmocollection.com', 'shopify'),
  merchant('Denjo', 'denjo', 'denjo.co', 'shopify'),
  merchant('Le Maillot', 'lemaillot', 'lemaillot-eg.com', 'shopify'),
  merchant('RAMLA', 'ramla', 'ramlastore.com', 'shopify'),
  merchant('ALIEL', 'aliel', 'alielofficial.com', 'shopify'),
  merchant('Farah Seif', 'farahseif', 'farahseif.com', 'shopify'),
  merchant('MAGMA', 'magma', 'magmasportswear.com', 'shopify'),
  merchant('Camicie', 'camicie', 'camicie-eg.com', 'shopify'),
  merchant('Emeli', 'emeli', 'emeliegypt.com', 'shopify'),
  merchant('Pepla', 'pepla', 'pepla.store', 'shopify'),
  merchant('Swijabi', 'swijabi', 'swijabi.com', 'shopify'),
  merchant('Libra Sports', 'librasports', 'libra-sportswear.com', 'shopify'),
  merchant('Up-Fuse', 'up-fuse', 'up-fuse.com', 'shopify'),
  merchant('UNTY', 'unty', 'unty.co', 'shopify'),
];
