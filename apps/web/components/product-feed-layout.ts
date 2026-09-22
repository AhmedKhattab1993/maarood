/**
 * Listing layouts.
 * Following is one stacked column. Explore, search, brand, and favourites
 * are a catalog grid: two columns on phones/tablets, three on desktop, four on wide screens.
 */

export type ProductLayout = 'feed' | 'grid';

export function productFeedListClass(): string {
  return 'mx-auto flex w-full max-w-xl flex-col gap-8';
}

export function productFeedItemClass(): string {
  return 'w-full';
}

export function productGridListClass(): string {
  return 'grid w-full grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-3 xl:grid-cols-4';
}

export function productGridItemClass(): string {
  return 'min-w-0';
}

export function productListClass(layout: ProductLayout): string {
  return layout === 'feed' ? productFeedListClass() : productGridListClass();
}

export function productItemClass(layout: ProductLayout): string {
  return layout === 'feed' ? productFeedItemClass() : productGridItemClass();
}
