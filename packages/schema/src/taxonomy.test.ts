import { describe, it, expect } from 'vitest';
import { categorize, CANONICAL_CATEGORIES } from './taxonomy';

describe('taxonomy.categorize', () => {
  it('matches apparel from title keywords', () => {
    expect(categorize({ title: 'Oversized Cotton Tee' }).category).toBe('apparel');
    expect(categorize({ title: 'Kids Sweatpants' }).category).toBe('apparel');
    expect(categorize({ title: 'Relaxed Fit Jeans' }).category).toBe('apparel');
  });

  it('matches footwear', () => {
    expect(categorize({ title: 'Running Sneakers' }).category).toBe('footwear');
    expect(categorize({ title: 'Leather Boots' }).category).toBe('footwear');
  });

  it('matches bags', () => {
    expect(categorize({ title: 'Canvas Tote Bag' }).category).toBe('bags');
    expect(categorize({ title: 'Leather Wallet' }).category).toBe('bags');
  });

  it('matches jewelry', () => {
    expect(categorize({ title: 'Gold Necklace' }).category).toBe('jewelry');
    expect(categorize({ title: 'Silver Ring' }).category).toBe('jewelry');
  });

  it('matches accessories', () => {
    expect(categorize({ title: 'Wool Beanie' }).category).toBe('accessories');
    expect(categorize({ title: 'Cotton Cap' }).category).toBe('accessories');
  });

  it('matches Arabic keywords', () => {
    expect(categorize({ title: 'حذاء رياضي' }).category).toBe('footwear');
    expect(categorize({ title: 'تيشيرت قطن' }).category).toBe('apparel');
    expect(categorize({ title: 'شنطة يد' }).category).toBe('bags');
  });

  it('falls back to other when nothing matches', () => {
    expect(categorize({ title: 'Generic Item With No Clues' }).category).toBe('other');
  });

  it('matches against product_type, tags, and handle, not just title', () => {
    expect(categorize({ title: 'Mystery', productType: 'T-Shirt' }).category).toBe('apparel');
    expect(categorize({ title: 'Mystery', tags: ['sneakers'] }).category).toBe('footwear');
    expect(categorize({ title: 'Mystery', handle: 'leather-belt' }).category).toBe('accessories');
  });

  it('does not treat a shorter word as a match inside a longer one', () => {
    expect(categorize({ title: 'Baggy Trousers' }).category).toBe('apparel');
    expect(categorize({ title: 'Baggy Jeans in Blue' }).category).toBe('apparel');
    expect(categorize({ title: 'BAGGY DENIM – LIGHT GREY' }).category).toBe('apparel');
    expect(categorize({ title: 'Baggy Waistband Jorts' }).category).toBe('apparel');
    expect(categorize({ title: 'AirFlex Baggy', productType: 'Men / Pants' }).category).toBe(
      'apparel',
    );
    expect(categorize({ title: 'Bootcut Jeans' }).category).toBe('apparel');
    expect(categorize({ title: 'Drawstring Pants' }).category).toBe('apparel');
    expect(categorize({ title: 'That cotton shirt' }).category).toBe('apparel');
    expect(categorize({ title: 'Steel water bottle' }).category).toBe('other');
  });

  it('lets the merchant product type beat an incidental word in the title', () => {
    expect(
      categorize({
        title: 'قفازات ملاكمة مع حقيبة',
        productType: 'Boxing Gloves',
      }).category,
    ).toBe('accessories');
    expect(categorize({ title: 'Tote Bag', productType: 'Women / Bags' }).category).toBe('bags');
  });

  it('still matches plurals and real bag words', () => {
    expect(categorize({ title: 'Leather Handbags' }).category).toBe('bags');
    expect(categorize({ title: 'Hard Shell Suitcase' }).category).toBe('bags');
    expect(categorize({ title: 'Quilted Pouch' }).category).toBe('bags');
    expect(categorize({ title: 'Oversized T-Shirts' }).category).toBe('apparel');
    expect(categorize({ title: 'Cap Sleeve Top' }).category).toBe('apparel');
    expect(categorize({ title: 'Printed Linen Sundress' }).category).toBe('apparel');
    expect(categorize({ title: 'Cotton Cap' }).category).toBe('accessories');
  });

  it('returns only canonical categories', () => {
    for (const cat of CANONICAL_CATEGORIES) {
      expect(['apparel', 'footwear', 'accessories', 'bags', 'jewelry', 'other']).toContain(cat);
    }
  });
});
