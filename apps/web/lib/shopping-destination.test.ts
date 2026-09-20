import { describe, expect, it } from "vitest";
import { shoppingDestination } from "./shopping-destination";

describe("shoppingDestination", () => {
  it("accepts http(s) URLs as-is", () => {
    expect(shoppingDestination("https://shop.example.com/p")).toEqual({
      ok: true,
      url: "https://shop.example.com/p",
    });
    expect(shoppingDestination("http://shop.example.com/p")).toEqual({
      ok: true,
      url: "http://shop.example.com/p",
    });
  });

  it("treats missing or blank redirect URLs as missing", () => {
    expect(shoppingDestination(null)).toEqual({ ok: false, reason: "missing" });
    expect(shoppingDestination(undefined)).toEqual({ ok: false, reason: "missing" });
    expect(shoppingDestination("")).toEqual({ ok: false, reason: "missing" });
    expect(shoppingDestination("   ")).toEqual({ ok: false, reason: "missing" });
  });

  it("rejects non-http(s) destinations", () => {
    expect(shoppingDestination("javascript:alert(1)")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(shoppingDestination("ftp://shop.example.com/p")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(shoppingDestination("not-a-url")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(shoppingDestination("/products/tee")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(shoppingDestination("//evil.example/p")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});
