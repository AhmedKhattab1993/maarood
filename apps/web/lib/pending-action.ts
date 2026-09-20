const STORAGE_KEY = "maarood.pending-action";

export type PendingAction =
  | { type: "follow"; merchantId: string; returnTo: string }
  | { type: "save"; productId: string; returnTo: string };

function store(): Storage | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

export function stash(action: PendingAction): void {
  const storage = store();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(action));
}

export function peek(): PendingAction | null {
  const storage = store();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingAction;
    if (parsed?.type === "follow" && typeof parsed.merchantId === "string") {
      return parsed;
    }
    if (parsed?.type === "save" && typeof parsed.productId === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** Read and clear. A second take returns null. */
export function take(): PendingAction | null {
  const action = peek();
  clear();
  return action;
}

export function clear(): void {
  store()?.removeItem(STORAGE_KEY);
}

/**
 * Only same-origin relative paths starting with a single `/`.
 * Blocks protocol-relative `//evil` and other open redirects.
 */
export function safeReturnTo(path: string): string | null {
  if (typeof path !== "string") return null;
  const value = path.trim();
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  if (value.includes("\\")) return null;
  return value;
}

export function currentReturnTo(): string {
  if (typeof window === "undefined") return "/";
  return safeReturnTo(`${window.location.pathname}${window.location.search}`) ?? "/";
}
