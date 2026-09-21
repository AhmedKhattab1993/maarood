import { describe, expect, it } from 'vitest';
import { parseFacetArray, tallyFacetValues } from './facet-values';

describe('parseFacetArray', () => {
  it('reads a JSON string array and drops blanks', () => {
    expect(parseFacetArray('["Black"," ", "M"]')).toEqual(['Black', 'M']);
  });

  it('returns nothing for invalid or non-array JSON', () => {
    expect(parseFacetArray('not-json')).toEqual([]);
    expect(parseFacetArray('{"color":"Black"}')).toEqual([]);
    expect(parseFacetArray(null)).toEqual([]);
  });
});

describe('tallyFacetValues', () => {
  it('merges case variants, counts each product once, and orders by frequency', () => {
    const values = tallyFacetValues(['["Black","black"]', '["BLACK"]', '["White"]']);
    expect(values[0]).toBe('Black');
    expect(values).toEqual(['Black', 'White']);
  });

  it('caps the list', () => {
    const raws = ['A', 'B', 'C', 'D'].map((value) => JSON.stringify([value]));
    expect(tallyFacetValues(raws, 2)).toEqual(['A', 'B']);
  });
});
