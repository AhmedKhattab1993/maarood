/**
 * Layout classes for the product feed (home, search, category, brand, saved,
 * and the listing skeleton). Single column of stacked posts — not a
 * multi-column product wall.
 */

export function productFeedListClass(): string {
  return "mx-auto flex w-full max-w-xl flex-col gap-8";
}

/** Each post is full width of the feed column. */
export function productFeedItemClass(): string {
  return "w-full";
}
