import { describe, expect, it } from "vitest";
import { indexAfterSwipe } from "./gallery-swipe";

describe("indexAfterSwipe", () => {
  it("advances when the finger moves left past the threshold", () => {
    expect(indexAfterSwipe(0, 4, -48)).toBe(1);
  });

  it("goes back when the finger moves right", () => {
    expect(indexAfterSwipe(2, 4, 60)).toBe(1);
  });

  it("ignores a short drag and a single photo", () => {
    expect(indexAfterSwipe(1, 4, -20)).toBe(1);
    expect(indexAfterSwipe(0, 1, -80)).toBe(0);
  });

  it("does not wrap past either end", () => {
    expect(indexAfterSwipe(0, 3, 80)).toBe(0);
    expect(indexAfterSwipe(2, 3, -80)).toBe(2);
  });
});
