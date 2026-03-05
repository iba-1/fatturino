import { describe, it, expect } from "vitest";
import { buildTrustedOrigins } from "../lib/auth.js";

describe("buildTrustedOrigins", () => {
  it("falls back to localhost:5173 when no env vars are set", () => {
    expect(buildTrustedOrigins({})).toEqual(["http://localhost:5173"]);
  });

  it("includes BETTER_AUTH_URL so the production monolith domain is trusted", () => {
    const origins = buildTrustedOrigins({
      BETTER_AUTH_URL: "https://fatturino.up.railway.app",
    });
    expect(origins).toContain("https://fatturino.up.railway.app");
  });

  it("does not include BETTER_AUTH_URL when it is not set", () => {
    const origins = buildTrustedOrigins({ CORS_ORIGINS: "https://example.com" });
    expect(origins).toEqual(["https://example.com"]);
  });

  it("parses multiple comma-separated CORS_ORIGINS", () => {
    const origins = buildTrustedOrigins({
      CORS_ORIGINS: "https://a.com,https://b.com",
      BETTER_AUTH_URL: "https://api.com",
    });
    expect(origins).toEqual(["https://a.com", "https://b.com", "https://api.com"]);
  });
});
