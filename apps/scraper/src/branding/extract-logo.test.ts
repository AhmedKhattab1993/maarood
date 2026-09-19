import { describe, expect, it } from 'vitest';
import { extractLogoUrl } from './extract-logo';

const SHOPIFY_HTML = `<!doctype html>
<html>
<head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"Antikkaeg","logo":"https://antikkaeg.com/cdn/shop/files/LOGO_CUT_OUT.png?v=1683715293&width=500"}
</script>
<link rel="icon" type="image/png" href="//antikkaeg.com/cdn/shop/files/LOGO_CUT_OUT.png?crop=center&height=32&v=1683715293&width=32">
</head>
<body>
<img src="//antikkaeg.com/cdn/shop/files/LOGO_CUT_OUT.png?v=1683715293" class="header__heading-logo" alt="Antikka">
<img src="https://cdn.shopify.com/s/files/1/x/visa-logo.png" alt="visa" class="payment-logo">
</body>
</html>`;

const WOO_HTML = `<!doctype html>
<html>
<head>
<meta property="og:image" content="https://kassemshijab.com/wp-content/uploads/2026/01/logo-transparent.png"/>
<link rel="apple-touch-icon" href="https://kassemshijab.com/wp-content/uploads/2026/01/cropped-logo-transparent-180x180.png" />
</head>
<body>
<img src="https://kassemshijab.com/wp-content/uploads/2026/01/logo-transparent.png" class="kitify-logo__img kitify-logo-default" alt="Kassem's Hijab" width="2155" height="2156">
</body>
</html>`;

const MAGENTO_JSON = JSON.stringify({
  data: {
    storeConfig: {
      header_logo_src: 'stores/1/mobaco.svg',
      secure_base_media_url: 'https://mobaco.hypernode.io/media/',
    },
  },
});

describe('extractLogoUrl', () => {
  it('reads an https logo from Shopify Organization JSON-LD', () => {
    const url = extractLogoUrl(SHOPIFY_HTML, 'https://antikkaeg.com/');
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain('LOGO_CUT_OUT.png');
    expect(url).not.toContain('visa-logo');
  });

  it('reads an https logo from WooCommerce header markup', () => {
    const url = extractLogoUrl(WOO_HTML, 'https://kassemshijab.com/');
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain('logo-transparent.png');
  });

  it('joins Magento storeConfig header_logo_src onto the media base', () => {
    const url = extractLogoUrl(MAGENTO_JSON, 'https://mobaco.com/');
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain('mobaco.hypernode.io/media/');
    expect(url).toContain('logo/stores/1/mobaco.svg');
  });

  it('returns null when Magento storeConfig has no logo src', () => {
    const url = extractLogoUrl(
      '{"data":{"storeConfig":{"header_logo_src":null,"secure_base_media_url":"https://mobaco.hypernode.io/media/"}}}',
      'https://mobaco.com/',
    );
    expect(url).toBeNull();
  });
});
