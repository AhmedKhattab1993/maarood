import { describe, expect, it } from "vitest";
import { mergeUniqueById } from "./feed-append";

describe("mergeUniqueById", () => {
  it("appends new ids and drops duplicates", () => {
    const existing = [{ id: "a" }, { id: "b" }];
    const incoming = [{ id: "b" }, { id: "c" }, { id: "a" }];
    expect(mergeUniqueById(existing, incoming)).toEqual([
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ]);
  });

  it("keeps first occurrence when incoming repeats an id", () => {
    expect(mergeUniqueById([], [{ id: "a" }, { id: "a" }])).toEqual([{ id: "a" }]);
  });
});
