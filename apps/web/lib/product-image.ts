/**
 * Cover / gallery src selection for listing cards and product detail.
 * First http(s) URL wins; missing or non-URL entries yield no src (placeholder).
 */

const HTTP_URL = /^https?:\/\//i;

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

/** Cover image for a listing card. Null → render the placeholder tile. */
export function coverSrc(
  imageUrls: readonly unknown[] | null | undefined,
): string | null {
  return httpUrls(imageUrls)[0] ?? null;
}

/** Ordered gallery srcs for product detail. */
export function gallerySrcs(
  imageUrls: readonly unknown[] | null | undefined,
): string[] {
  return httpUrls(imageUrls);
}
