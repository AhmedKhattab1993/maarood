import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clear,
  peek,
  safeReturnTo,
  stash,
  take,
} from "./pending-action";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => [...map.keys()][index] ?? null,
  };
}

describe("pending-action", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: memoryStorage(),
      configurable: true,
    });
  });

  afterEach(() => {
    clear();
  });

  it("stashes an action and take reads it once", () => {
    const action = {
      type: "follow" as const,
      merchantId: "m1",
      returnTo: "/ar/p/1",
    };
    stash(action);
    expect(peek()).toEqual(action);
    expect(take()).toEqual(action);
    expect(take()).toBeNull();
    expect(peek()).toBeNull();
  });

  it("stashes a save action", () => {
    stash({ type: "save", productId: "p1", returnTo: "/en" });
    expect(take()).toEqual({
      type: "save",
      productId: "p1",
      returnTo: "/en",
    });
  });
});

describe("safeReturnTo", () => {
  it("allows same-origin relative paths", () => {
    expect(safeReturnTo("/ar/p/1")).toBe("/ar/p/1");
    expect(safeReturnTo("/en/search?q=tee")).toBe("/en/search?q=tee");
  });

  it("blocks protocol-relative and absolute URLs", () => {
    expect(safeReturnTo("//evil")).toBeNull();
    expect(safeReturnTo("https://evil.example")).toBeNull();
    expect(safeReturnTo("/\\evil")).toBeNull();
    expect(safeReturnTo("p/1")).toBeNull();
  });
});

describe("AuthForm pending action", () => {
  const src = readFileSync(
    new URL("../components/auth-form.tsx", import.meta.url),
    "utf8",
  );

  it("executes take() once after login and has a Cancel path", () => {
    expect(src).toMatch(/take\(\)/);
    expect(src).toMatch(/followBrand\(action\.merchantId\)/);
    expect(src).toMatch(/saveProduct\(action\.productId\)/);
    expect(src).toMatch(/t\(["']cancel["']\)/);
    expect(src).toMatch(/safeReturnTo/);
  });
});
