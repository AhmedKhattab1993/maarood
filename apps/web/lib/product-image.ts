/**
 * Cover / gallery src selection for listing cards and product detail.
 * First usable product photo wins; size-chart / measurement plates are never
 * the cover (they stay in the gallery after real photos).
 */

const HTTP_URL = /^https?:\/\//i;

/** Size-scale / measurement plates — never the primary product photo. */
const SIZE_CHART =
  /product_measurements|size[_-]?chart|size[_-]?guide|size[_-]?scale|measurements?/i;

export function isSizeChartImage(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return SIZE_CHART.test(path);
  } catch {
    return SIZE_CHART.test(url);
  }
}

function httpUrls(imageUrls: readonly unknown[] | null | undefined): string[] {
  if (!imageUrls) return [];
  const out: string[] = [];
  for (const value of imageUrls) {
    if (typeof value !== "string") continue;
    const url = value.trim();
    if (HTTP_URL.test(url)) out.push(url);
  }
  return out;
}

function productPhotosFirst(urls: string[]): string[] {
  const photos: string[] = [];
  const charts: string[] = [];
  for (const url of urls) {
    if (isSizeChartImage(url)) charts.push(url);
    else photos.push(url);
  }
  return [...photos, ...charts];
}

/** Cover image for a listing card. Null → render the placeholder tile. */
export function coverSrc(
  imageUrls: readonly unknown[] | null | undefined,
): string | null {
  const ordered = productPhotosFirst(httpUrls(imageUrls));
  return ordered.find((url) => !isSizeChartImage(url)) ?? null;
}

/** Ordered gallery srcs: product photos first, size charts last. */
export function gallerySrcs(
  imageUrls: readonly unknown[] | null | undefined,
): string[] {
  return productPhotosFirst(httpUrls(imageUrls));
}
