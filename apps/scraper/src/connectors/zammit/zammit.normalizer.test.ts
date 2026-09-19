import { describe, expect, it } from 'vitest';
import { parseZammitProductsPage } from './zammit.connector';
import { normalizeZammitProduct } from './zammit.normalizer';
import { parseZammitApiHost, zammitProductsUrl, zammitStorefrontHeaders } from './zammit.query';

const MERCHANT_ID = '00000000-0000-4000-8000-000000000001';

const zammitItem = {
  id: 1001005,
  name: 'Pause Hoodie _ Black',
  handle: 'Pause-Hoodie--Black',
  description: '<ul><li><b>Unisex</b></li></ul>',
  type: '',
  vendor: '',
  tags: [],
  status: 'visible',
  quantity: 15,
  isTracked: true,
  isOnSale: true,
  priceCents: 99900,
  discountedPriceCents: 79500,
  thumbUrl: 'https://bucket.zammit.shop/active-storage/ftgyq010fl1r2dgh0zoe2oel6o0u',
  thumbUrls: ['https://bucket.zammit.shop/active-storage/ftgyq010fl1r2dgh0zoe2oel6o0u'],
  secondaryThumbUrls: ['https://bucket.zammit.shop/active-storage/ryak7joyzikcc1bl63tjsul2hewm'],
  productOptions: [{ name: 'SIZE', values: ['large', 'XLarge', '2XLarge'], option: { name: 'size' } }],
  variants: [
    { id: 1, quantity: 5, isTracked: true, isOnSale: true, priceCents: 99900, discountedPriceCents: 49900, sku: '' },
    { id: 2, quantity: 5, isTracked: true, isOnSale: true, priceCents: 99900, discountedPriceCents: 49900, sku: '' },
    { id: 3, quantity: 0, isTracked: true, isOnSale: true, priceCents: 99900, discountedPriceCents: 49900, sku: '' },
  ],
};

describe('zammitProductsUrl', () => {
  it('targets api/v2/products/fast with shop_query, not Shopify JSON', () => {
    const url = zammitProductsUrl('https://api.zammit.shop', 2, 50);
    expect(url).toBe(
      'https://api.zammit.shop/api/v2/products/fast?shop_query=true&page=2&limit=50&include_second_thumb=true',
    );
    expect(url).not.toContain('/products.json');
    expect(url).not.toContain('/wp-json/');
  });
});

describe('zammitStorefrontHeaders', () => {
  it('sends the shop hostname as the domain header', () => {
    expect(zammitStorefrontHeaders('suystore.com')).toMatchObject({
      domain: 'suystore.com',
      locale: 'en',
    });
  });
});

describe('parseZammitApiHost', () => {
  it('reads NEXT_PUBLIC_API_HOST from __NEXT_DATA__', () => {
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      runtimeConfig: { NEXT_PUBLIC_API_HOST: 'https://api.zammit.shop' },
    })}</script></html>`;
    expect(parseZammitApiHost(html)).toBe('https://api.zammit.shop');
  });

  it('falls back to the Zammit API host when NEXT_DATA is missing', () => {
    expect(parseZammitApiHost('<html></html>')).toBe('https://api.zammit.shop');
  });
});

describe('parseZammitProductsPage', () => {
  it('reads products and pagination from the fast payload', () => {
    const page = parseZammitProductsPage({
      success: true,
      data: {
        products: [zammitItem],
        metadata: { totalCount: 39, totalPages: 1, currentPage: 1, perPage: 50 },
      },
    });
    expect(page.products).toHaveLength(1);
    expect(page.products[0]?.id).toBe(1001005);
    expect(page.totalPages).toBe(1);
  });
});

describe('normalizeZammitProduct', () => {
  it('emits title, EGP prices in major units, sizes, and https images', () => {
    const p = normalizeZammitProduct(zammitItem, MERCHANT_ID, 'suystore.com');
    expect(p.title).toBe('Pause Hoodie _ Black');
    expect(p.currentPrice).toBe(795);
    expect(p.previousPrice).toBe(999);
    expect(p.currency).toBe('EGP');
    expect(p.merchantProductId).toBe('1001005');
    expect(p.sourceUrl).toBe('https://suystore.com/en/shop/products/Pause-Hoodie--Black');
    expect(p.sizes).toEqual(['large', 'XLarge', '2XLarge']);
    expect(p.variants[0]?.size).toBe('large');
    expect(p.imageUrls[0]).toMatch(/^https:\/\/bucket\.zammit\.shop\//);
    expect(p.availability).toBe('in_stock');
  });
});
