import { describe, it, expect } from 'vitest';
import {
  AVAILABILITY_FRESHNESS_MS,
  isConfirmedInStock,
  isConfirmedOutOfStock,
  resolveAvailability,
} from './availability';

const now = new Date('2026-06-01T12:00:00.000Z');
const fresh = new Date(now.getTime() - 60 * 60 * 1000);
const stale = new Date(now.getTime() - AVAILABILITY_FRESHNESS_MS - 1);

describe('resolveAvailability', () => {
  it('uses a fresh stored value as-is', () => {
    expect(resolveAvailability('in_stock', fresh, now)).toBe('in_stock');
    expect(resolveAvailability('out_of_stock', fresh, now)).toBe('out_of_stock');
    expect(resolveAvailability('unknown', fresh, now)).toBe('unknown');
  });

  it('does not treat unknown as in_stock', () => {
    expect(resolveAvailability('unknown', fresh, now)).not.toBe('in_stock');
    expect(resolveAvailability('unknown', null, now)).not.toBe('in_stock');
  });

  it('treats missing checks as unknown, never in_stock', () => {
    expect(resolveAvailability('in_stock', null, now)).toBe('unknown');
    expect(resolveAvailability('out_of_stock', null, now)).toBe('unknown');
    expect(resolveAvailability('unknown', null, now)).toBe('unknown');
  });

  it('treats stale checks as unknown, including stale out_of_stock', () => {
    expect(resolveAvailability('in_stock', stale, now)).toBe('unknown');
    expect(resolveAvailability('out_of_stock', stale, now)).toBe('unknown');
    expect(resolveAvailability('unknown', stale, now)).toBe('unknown');
  });
});

describe('isConfirmedOutOfStock / isConfirmedInStock', () => {
  it('confirms only fresh stored values', () => {
    expect(isConfirmedOutOfStock('out_of_stock', fresh, now)).toBe(true);
    expect(isConfirmedInStock('in_stock', fresh, now)).toBe(true);
    expect(isConfirmedOutOfStock('out_of_stock', null, now)).toBe(false);
    expect(isConfirmedOutOfStock('out_of_stock', stale, now)).toBe(false);
    expect(isConfirmedInStock('in_stock', null, now)).toBe(false);
    expect(isConfirmedInStock('unknown', fresh, now)).toBe(false);
  });
});
