import { describe, expect, it } from 'vitest';
import { normalizeShopifyProduct } from './shopify.normalizer';

const MERCHANT_ID = '00000000-0000-4000-8000-000000000001';

describe('normalizeShopifyProduct', () => {
  it('decodes HTML entities in title and stripped description', () => {
    const product = normalizeShopifyProduct(
      {
        id: 1,
        title: "Women&#39;s Cotton Tee",
        handle: 'womens-cotton-tee',
        body_html: '<p>Pants &amp; Denim</p>',
        vendor: 'Acme',
        product_type: 'T-Shirts',
        tags: [],
        variants: [
          {
            id: 11,
            title: 'S',
            price: '250.00',
            compare_at_price: null,
            available: true,
            option1: 'S',
          },
        ],
        images: [{ src: 'https://cdn.shopify.com/s/files/1/x.jpg' }],
        options: [],
      },
      MERCHANT_ID,
      'shop.example.com',
    );
    expect(product.title).toBe("Women's Cotton Tee");
    expect(product.description).toBe('Pants & Denim');
  });
});
