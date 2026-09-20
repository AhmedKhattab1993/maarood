export type FollowIntent = "login" | "follow" | "unfollow";
export type SaveIntent = "login" | "save" | "unsave";
export type ToggleVisual = "inactive" | "active" | "pending" | "failed";

/**
 * What the Follow control should do for this viewer and follow state.
 * Anonymous viewers always go to login, even if client state says following.
 */
export function followIntent(hasToken: boolean, following: boolean): FollowIntent {
  if (!hasToken) return "login";
  return following ? "unfollow" : "follow";
}

export function saveIntent(hasToken: boolean, saved: boolean): SaveIntent {
  if (!hasToken) return "login";
  return saved ? "unsave" : "save";
}

/** pending wins, then failed, then active/inactive. Failed is never active. */
export function toggleVisual(
  active: boolean,
  pending: boolean,
  failed: boolean,
): ToggleVisual {
  if (pending) return "pending";
  if (failed) return "failed";
  return active ? "active" : "inactive";
}
