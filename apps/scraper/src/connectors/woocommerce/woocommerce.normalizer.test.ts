import { describe, expect, it } from 'vitest';
import { parseWooCommercePage } from './woocommerce.connector';
import { normalizeWooCommerceProduct } from './woocommerce.normalizer';

const MERCHANT_ID = '00000000-0000-4000-8000-000000000001';

/** Nileton Store API shape: Color variation axis is present but value is null. */
const niletonPage = [
  {
    id: 57277,
    name: 'Sport Top Long Sleeves &#8211; Purple',
    type: 'variable',
    permalink: 'https://nileton.com/product/sport-top-long-sleeves-purple/',
    sku: '1162',
    short_description: '',
    description: '<p>A women&#8217;s long sleeve sport top.</p>',
    on_sale: true,
    prices: {
      price: '36500',
      regular_price: '36500',
      sale_price: '36500',
      currency_code: 'EGP',
      currency_minor_unit: 2,
    },
    images: [{ src: 'https://nileton.com/wp-content/uploads/2024/03/n0.webp' }],
    categories: [
      { id: 49, name: 'WOMEN', slug: 'women' },
      { id: 51, name: 'SPORTSWEAR', slug: 'sportswear' },
    ],
    tags: [{ name: 'NEW ARRIVALS' }],
    attributes: [
      {
        id: 1,
        name: 'Size',
        taxonomy: 'pa_size',
        has_variations: true,
        terms: [
          { id: 78, name: '2XL', slug: '2xl' },
          { id: 75, name: 'S', slug: 's' },
        ],
      },
      {
        id: 2,
        name: 'Color',
        taxonomy: 'pa_color',
        has_variations: true,
        terms: [{ id: 130, name: 'Purple', slug: 'purple' }],
      },
    ],
    variations: [
      {
        id: 153790,
        attributes: [
          { name: 'Size', value: '2xl' },
          { name: 'Color', value: null },
        ],
      },
      {
        id: 57278,
        attributes: [
          { name: 'Size', value: 's' },
          { name: 'Color', value: null },
        ],
      },
    ],
    is_in_stock: true,
    is_purchasable: true,
  },
];

describe('parseWooCommercePage', () => {
  it('accepts Store API variations whose attribute value is null', () => {
    const page = parseWooCommercePage(niletonPage);
    expect(page).toHaveLength(1);
    expect(page[0]?.variations[0]?.attributes[1]?.value).toBeNull();
  });
});

const katjieLocalAttributesPage = [
  {
    id: 1497,
    name: 'Shark Pyjama',
    type: 'variable',
    permalink: 'https://katjie.com/product/shark-pyjama/',
    sku: '3034',
    short_description: '',
    description: '<p>Baby pyjama.</p>',
    prices: {
      price: '45000',
      regular_price: '45000',
      sale_price: '45000',
      currency_code: 'EGP',
      currency_minor_unit: 2,
    },
    images: [{ src: 'https://katjie.com/wp-content/uploads/shark.jpg' }],
    categories: [{ id: 1, name: 'Baby', slug: 'baby' }],
    tags: [],
    attributes: [
      {
        id: 0,
        name: 'colors',
        taxonomy: null,
        has_variations: true,
        terms: [
          { id: 0, name: 'Blue', slug: 'Blue' },
          { id: 0, name: 'Pistage', slug: 'Pistage' },
        ],
      },
      {
        id: 0,
        name: 'Size',
        taxonomy: null,
        has_variations: true,
        terms: [{ id: 0, name: '0-3 Months', slug: '0-3 Months' }],
      },
    ],
    variations: [
      {
        id: 1,
        attributes: [
          { name: 'colors', value: 'Blue' },
          { name: 'Size', value: '0-3 Months' },
        ],
      },
    ],
    is_in_stock: true,
    is_purchasable: true,
  },
];

describe('parseWooCommercePage local attributes', () => {
  it('accepts attributes whose taxonomy is null', () => {
    const page = parseWooCommercePage(katjieLocalAttributesPage);
    expect(page).toHaveLength(1);
    expect(page[0]?.attributes[0]?.taxonomy).toBeNull();
  });
});

describe('normalizeWooCommerceProduct', () => {
  it('keeps sized variants when a color axis is null', () => {
    const [raw] = parseWooCommercePage(niletonPage);
    const p = normalizeWooCommerceProduct(raw, MERCHANT_ID);
    expect(p.title).toContain('Sport Top Long Sleeves');
    expect(p.currentPrice).toBe(365);
    expect(p.currency).toBe('EGP');
    expect(p.sizes).toEqual(expect.arrayContaining(['2XL', 'S']));
    expect(p.variants[0]?.size).toBe('2XL');
    expect(p.variants[0]?.color).toBeUndefined();
    expect(p.imageUrls[0]).toMatch(/^https:\/\/nileton\.com\//);
  });
});
