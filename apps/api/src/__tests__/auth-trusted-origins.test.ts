import { describe, it, expect } from "vitest";
import { buildTrustedOrigins, resolveBaseURL } from "../lib/auth.js";

describe("resolveBaseURL", () => {
  it("prefers explicit BETTER_AUTH_URL", () => {
    expect(resolveBaseURL({
      BETTER_AUTH_URL: "https://custom.com",
      RAILWAY_PUBLIC_DOMAIN: "app.railway.app",
    })).toBe("https://custom.com");
  });

  it("falls back to Railway domain when BETTER_AUTH_URL is not set", () => {
    expect(resolveBaseURL({
      RAILWAY_PUBLIC_DOMAIN: "fatturino.up.railway.app",
    })).toBe("https://fatturino.up.railway.app");
  });

  it("falls back to localhost when no env vars are set", () => {
    expect(resolveBaseURL({})).toBe("http://localhost:3000");
  });

  it("uses PORT env var for local fallback", () => {
    expect(resolveBaseURL({ PORT: "4000" })).toBe("http://localhost:4000");
  });
});

describe("buildTrustedOrigins", () => {
  it("includes localhost origins when no env vars are set", () => {
    const origins = buildTrustedOrigins({});
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://localhost:5173");
  });

  it("includes BETTER_AUTH_URL so the production monolith domain is trusted", () => {
    const origins = buildTrustedOrigins({
      BETTER_AUTH_URL: "https://fatturino.up.railway.app",
    });
    expect(origins).toContain("https://fatturino.up.railway.app");
  });

  it("auto-detects Railway domain without explicit BETTER_AUTH_URL", () => {
    const origins = buildTrustedOrigins({
      RAILWAY_PUBLIC_DOMAIN: "fatturino.up.railway.app",
    });
    expect(origins).toContain("https://fatturino.up.railway.app");
  });

  it("includes CORS_ORIGINS alongside base URL", () => {
    const origins = buildTrustedOrigins({ CORS_ORIGINS: "https://example.com" });
    expect(origins).toContain("https://example.com");
    expect(origins).toContain("http://localhost:3000");
  });

  it("parses multiple comma-separated CORS_ORIGINS", () => {
    const origins = buildTrustedOrigins({
      CORS_ORIGINS: "https://a.com,https://b.com",
      BETTER_AUTH_URL: "https://api.com",
    });
    expect(origins).toContain("https://a.com");
    expect(origins).toContain("https://b.com");
    expect(origins).toContain("https://api.com");
  });

  it("deduplicates when base URL matches a CORS origin", () => {
    const origins = buildTrustedOrigins({
      BETTER_AUTH_URL: "https://app.com",
      CORS_ORIGINS: "https://app.com",
    });
    const count = origins.filter((o) => o === "https://app.com").length;
    expect(count).toBe(1);
  });
});
