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

  it('returns only canonical categories', () => {
    for (const cat of CANONICAL_CATEGORIES) {
      expect(['apparel', 'footwear', 'accessories', 'bags', 'jewelry', 'other']).toContain(cat);
    }
  });
});
