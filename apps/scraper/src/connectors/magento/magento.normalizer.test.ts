import { describe, it, expect } from 'vitest';
import { magentoProductsUrl, magentoStoreConfigUrl } from './magento.query';
import { parseMagentoProductsPage } from './magento.connector';
import { normalizeMagentoProduct } from './magento.normalizer';

const MERCHANT_ID = '00000000-0000-4000-8000-000000000001';

const magentoItem = {
  sku: 'MS110129-0',
  name: 'CEBE Regular Fit Mao Cotton Linen Shirt',
  url_key: 'cebe-regular-fit-mao-cotton-linen-shirt-ms110129-0',
  stock_status: 'IN_STOCK',
  image: {
    url: 'https://mobaco.hypernode.io/media/catalog/product/c/e/cebe_lnc_mao_l104_f01.jpg',
  },
  media_gallery: [
    { url: 'https://mobaco.hypernode.io/media/catalog/product/c/e/cebe_lnc_mao_l104_f01.jpg' },
  ],
  price_range: {
    minimum_price: {
      regular_price: { value: 1290, currency: 'EGP' },
      final_price: { value: 990, currency: 'EGP' },
    },
  },
  categories: [{ name: 'Men' }, { name: 'Shirts' }],
  description: { html: '<p>A linen shirt.</p>' },
  short_description: { html: '' },
  variants: [
    {
      product: {
        sku: 'MS110129-0-M',
        stock_status: 'IN_STOCK',
        price_range: {
          minimum_price: {
            regular_price: { value: 1290 },
            final_price: { value: 990 },
          },
        },
      },
      attributes: [
        { label: 'Navy', code: 'color' },
        { label: 'M', code: 'size' },
      ],
    },
  ],
};

describe('magentoProductsUrl', () => {
  it('targets GET GraphQL products, not the retired Woo Store API', () => {
    const url = magentoProductsUrl('mobaco.com', 1);
    expect(url.startsWith('https://mobaco.com/graphql?query=')).toBe(true);
    expect(url).toContain('products');
    expect(url).not.toContain('/wp-json/');
    expect(url).not.toContain('wc/store');
    const query = decodeURIComponent(url.split('query=')[1] ?? '');
    expect(query).toContain('products(search:""');
    expect(query).toContain('currentPage:1');
  });
});

describe('magentoStoreConfigUrl', () => {
  it('targets GET GraphQL storeConfig for the header logo', () => {
    const url = magentoStoreConfigUrl('mobaco.com');
    expect(url.startsWith('https://mobaco.com/graphql?query=')).toBe(true);
    const query = decodeURIComponent(url.split('query=')[1] ?? '');
    expect(query).toContain('storeConfig');
    expect(query).toContain('header_logo_src');
    expect(query).toContain('secure_base_media_url');
  });
});

describe('normalizeMagentoProduct', () => {
  it('emits title, numeric price, and https image URLs from a GraphQL item', () => {
    const p = normalizeMagentoProduct(magentoItem, MERCHANT_ID, 'mobaco.com');
    expect(p.title).toBe('CEBE Regular Fit Mao Cotton Linen Shirt');
    expect(p.currentPrice).toBe(990);
    expect(p.previousPrice).toBe(1290);
    expect(p.currency).toBe('EGP');
    expect(p.imageUrls.length).toBeGreaterThan(0);
    expect(p.imageUrls[0]).toMatch(/^https?:\/\//);
    expect(p.imageUrls[0]).toContain('hypernode.io/media/catalog');
    expect(p.merchantProductId).toBe('MS110129-0');
  });

  it('does not use a size-chart plate as the primary image when a product photo exists', () => {
    const p = normalizeMagentoProduct(
      {
        ...magentoItem,
        image: {
          url: 'https://mobaco.hypernode.io/static/version1/frontend/Magento/luma/en_US/Magento_Catalog/images/product/placeholder/image.jpg',
        },
        media_gallery: [
          {
            url: 'https://mobaco.hypernode.io/media/catalog/product/p/r/product_measurements_246.jpg',
            label: 'Linen Shorts',
          },
          {
            url: 'https://mobaco.hypernode.io/media/catalog/product/b/o/body_image_209.jpg',
            label: 'Linen Shorts',
          },
          {
            url: 'https://mobaco.hypernode.io/media/catalog/product/l/l/ll350_0020_f01.jpg',
            label: 'Linen Shorts',
          },
        ],
      },
      MERCHANT_ID,
      'mobaco.com',
    );
    expect(p.imageUrls[0]).toBe(
      'https://mobaco.hypernode.io/media/catalog/product/b/o/body_image_209.jpg',
    );
    expect(p.imageUrls[0]).not.toMatch(/product_measurements/);
    expect(p.imageUrls.at(-1)).toMatch(/product_measurements/);
  });

  it('drops Magento placeholder images', () => {
    const p = normalizeMagentoProduct(
      {
        ...magentoItem,
        image: {
          url: 'https://mobaco.hypernode.io/static/version1/frontend/Magento/luma/en_US/Magento_Catalog/images/product/placeholder/image.jpg',
        },
        media_gallery: [],
        small_image: { url: null },
        thumbnail: { url: null },
      },
      MERCHANT_ID,
      'mobaco.com',
    );
    expect(p.imageUrls).toEqual([]);
  });
});

describe('parseMagentoProductsPage', () => {
  it('reads items from a GraphQL products envelope', () => {
    const page = parseMagentoProductsPage({
      data: {
        products: {
          total_count: 1,
          page_info: { current_page: 1, page_size: 50, total_pages: 8 },
          items: [magentoItem],
        },
      },
    });
    expect(page.items).toHaveLength(1);
    expect(page.totalPages).toBe(8);
    expect(page.items[0]?.sku).toBe('MS110129-0');
  });
});
