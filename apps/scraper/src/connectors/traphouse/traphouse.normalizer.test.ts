import { describe, expect, it } from 'vitest';
import { parseTraphouseProducts } from './traphouse.connector';
import { normalizeTraphouseProduct } from './traphouse.normalizer';
import {
  parseSupabaseConfig,
  supabaseProductsUrl,
  supabaseRestHeaders,
  traphouseAbsoluteUrl,
  traphouseConfigUrl,
} from './traphouse.query';

const MERCHANT_ID = '00000000-0000-4000-8000-000000000001';

const objectVariantsRow = {
  id: 'b0faf7b5-cfed-403a-8691-8bd6f0b9bf1b',
  name: 'BANDOBOY CLASSIC BANDO',
  price: 500,
  tag: 'NEW',
  image: 'latest drops/Traphouse Bandoboy Classic Bando.jpg',
  description: 'Classic fit tee with Bandoboy logo print. 100% Egyptian cotton.',
  buy_link: '',
  variants: {
    links: {
      'S / White': 'https://accept.paymobsolutions.com/standalone?ref=abc',
    },
    types: [
      { type: 'Size', options: ['S', 'M', 'L', 'XL'] },
      { type: 'Color', options: ['Black', 'White'] },
    ],
  },
};

const arrayVariantsRow = {
  id: '1dc47aa9-8650-4311-ba51-abaa6ab34af1',
  name: 'TRAPHOUSE WORLDWIDE',
  price: 650,
  tag: 'NEW',
  image: 'latest drops/Traphouse Worldwide.jpg',
  description: 'Represent the worldwide movement. Relaxed fit tee.',
  buy_link: '',
  variants: [
    {
      type: 'Size',
      options: [{ name: 'S', buyLink: '' }, { name: 'M', buyLink: '' }],
    },
    {
      type: 'Color',
      options: [{ name: 'Black', buyLink: '' }, { name: 'Navy', buyLink: '' }],
    },
  ],
};

describe('traphouse query helpers', () => {
  it('parses the public supabase-config.js the storefront ships', () => {
    const js = `
      const SUPABASE_URL = 'https://ylebobtkzjujpzrztead.supabase.co';
      const SUPABASE_ANON_KEY = 'sb_publishable_testkey';
    `;
    expect(parseSupabaseConfig(js)).toEqual({
      url: 'https://ylebobtkzjujpzrztead.supabase.co',
      anonKey: 'sb_publishable_testkey',
    });
    expect(supabaseProductsUrl('https://ylebobtkzjujpzrztead.supabase.co')).toBe(
      'https://ylebobtkzjujpzrztead.supabase.co/rest/v1/products?select=*&order=sort_order.asc',
    );
    expect(supabaseRestHeaders('sb_publishable_testkey')).toEqual({
      apikey: 'sb_publishable_testkey',
      Authorization: 'Bearer sb_publishable_testkey',
    });
    expect(traphouseConfigUrl('traphouse.ltd')).toBe('https://traphouse.ltd/supabase-config.js');
  });

  it('absolutizes storefront-relative image paths', () => {
    expect(traphouseAbsoluteUrl('latest drops/Traphouse Worldwide.jpg', 'traphouse.ltd')).toBe(
      'https://traphouse.ltd/latest%20drops/Traphouse%20Worldwide.jpg',
    );
  });
});

describe('parseTraphouseProducts', () => {
  it('accepts the live Supabase array payload', () => {
    const rows = parseTraphouseProducts([objectVariantsRow, arrayVariantsRow]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe('BANDOBOY CLASSIC BANDO');
  });
});

describe('normalizeTraphouseProduct', () => {
  it('emits title, EGP price, sizes/colors, and an https image from object variants', () => {
    const p = normalizeTraphouseProduct(objectVariantsRow, MERCHANT_ID, 'traphouse.ltd');
    expect(p.title).toBe('BANDOBOY CLASSIC BANDO');
    expect(p.currentPrice).toBe(500);
    expect(p.currency).toBe('EGP');
    expect(p.sizes).toEqual(['S', 'M', 'L', 'XL']);
    expect(p.colors).toEqual(['Black', 'White']);
    expect(p.imageUrls[0]).toBe(
      'https://traphouse.ltd/latest%20drops/Traphouse%20Bandoboy%20Classic%20Bando.jpg',
    );
    expect(p.redirectUrl).toMatch(/^https:\/\//);
    expect(p.availability).toBe('in_stock');
  });

  it('reads the older array variant shape', () => {
    const p = normalizeTraphouseProduct(arrayVariantsRow, MERCHANT_ID, 'traphouse.ltd');
    expect(p.title).toBe('TRAPHOUSE WORLDWIDE');
    expect(p.currentPrice).toBe(650);
    expect(p.sizes).toEqual(['S', 'M']);
    expect(p.colors).toEqual(['Black', 'Navy']);
  });
});
