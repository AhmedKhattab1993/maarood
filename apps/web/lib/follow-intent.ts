export type FollowIntent = "login" | "follow" | "unfollow";

/**
 * What the Follow control should do for this viewer and follow state.
 * Anonymous viewers always go to login, even if client state says following.
 */
export function followIntent(hasToken: boolean, following: boolean): FollowIntent {
  if (!hasToken) return "login";
  return following ? "unfollow" : "follow";
}
