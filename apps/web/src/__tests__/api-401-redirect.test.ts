import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "../lib/api";

describe("401 interceptor", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock window.location.href assignment
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, href: "" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("redirects to /login on 401 response from api.get", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    } as Response);

    // The promise should hang (never resolve/reject) because we're redirecting
    const result = api.get("/dashboard");

    // Give the redirect a tick to happen
    await new Promise((r) => setTimeout(r, 10));

    expect(window.location.href).toBe("/login");

    // Verify the promise is still pending (not rejected with ApiError)
    const settled = await Promise.race([
      result.then(() => "resolved").catch(() => "rejected"),
      new Promise((r) => setTimeout(() => r("pending"), 50)),
    ]);
    expect(settled).toBe("pending");
  });

  it("redirects to /login on 401 response from api.post", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    } as Response);

    api.post("/invoices", { amount: 100 });

    await new Promise((r) => setTimeout(r, 10));

    expect(window.location.href).toBe("/login");
  });

  it("does not redirect on non-401 errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad Request" }),
    } as Response);

    await expect(api.get("/bad")).rejects.toThrow("Bad Request");
    expect(window.location.href).not.toBe("/login");
  });

  it("does not redirect on successful responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
    } as Response);

    await api.get("/good");
    expect(window.location.href).not.toBe("/login");
  });
});
