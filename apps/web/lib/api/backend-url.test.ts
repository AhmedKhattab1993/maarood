import { describe, it, expect } from "vitest";
import { publicBackendUrl, serverBackendUrl } from "./backend-url";

describe("serverBackendUrl", () => {
  it("uses BACKEND_URL when set (public IPv4 origin, not localhost)", () => {
    const url = serverBackendUrl({
      BACKEND_URL: "http://169.58.14.92:8080",
    });
    expect(url).toBe("http://169.58.14.92:8080");
    expect(url).not.toMatch(/localhost|127\.0\.0\.1/);
  });

  it("falls back to loopback only when BACKEND_URL is missing", () => {
    expect(serverBackendUrl({})).toBe("http://localhost:8080");
  });

  it("strips a trailing slash so hrefs stay well-formed", () => {
    expect(serverBackendUrl({ BACKEND_URL: "http://169.58.14.92:8080/" })).toBe(
      "http://169.58.14.92:8080",
    );
  });
});

describe("publicBackendUrl", () => {
  it("uses NEXT_PUBLIC_BACKEND_URL when set (browser-facing public IPv4)", () => {
    const url = publicBackendUrl({
      NEXT_PUBLIC_BACKEND_URL: "http://169.58.14.92:8080",
    });
    expect(url).toBe("http://169.58.14.92:8080");
    expect(url).not.toMatch(/localhost|127\.0\.0\.1/);
  });

  it("falls back to loopback only when NEXT_PUBLIC_BACKEND_URL is missing", () => {
    expect(publicBackendUrl({})).toBe("http://localhost:8080");
  });
});
