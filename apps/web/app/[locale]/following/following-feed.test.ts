import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const feed = readFileSync(new URL("./following-feed.tsx", import.meta.url), "utf8");

describe("Following product posts", () => {
  it("puts GET /v1/me/following logoUrl on the posting author payload", () => {
    expect(feed).toMatch(/listFollowing/);
    expect(feed).toMatch(/logoUrl: f\.logoUrl/);
    expect(feed).toMatch(/DiscoveryFeed/);
    expect(feed).toMatch(/suggested/);
  });
});
