/** Primary X-style destinations. Spatial: Following left, Explore center, Favourites right. */
export const MAIN_TABS = [
  { id: "following", pathname: "/following" as const },
  { id: "explore", pathname: "/" as const },
  { id: "favourites", pathname: "/favourites" as const },
] as const;

export type MainTabId = (typeof MAIN_TABS)[number]["id"];

export function mainTabIdForPath(pathname: string): MainTabId | null {
  if (pathname === "/following") return "following";
  if (pathname === "/favourites" || pathname === "/saved") return "favourites";
  if (pathname === "/") return "explore";
  return null;
}
