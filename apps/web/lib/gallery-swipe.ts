/** Finger movement, in CSS pixels, required before a swipe changes the photo. */
export const SWIPE_THRESHOLD_PX = 48;

/**
 * Next gallery index after a horizontal swipe.
 * Negative deltaX (finger moved left) advances. Movement below the threshold
 * and swipes past either end leave the index unchanged.
 */
export function indexAfterSwipe(
  index: number,
  count: number,
  deltaX: number,
  threshold = SWIPE_THRESHOLD_PX,
): number {
  if (count <= 1 || Math.abs(deltaX) < threshold) return index;
  const next = deltaX < 0 ? index + 1 : index - 1;
  if (next < 0 || next >= count) return index;
  return next;
}
