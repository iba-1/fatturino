import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "../lib/api";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should make GET requests with credentials", async () => {
    const mockResponse = { data: "test" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await api.get("/clients");

    expect(fetch).toHaveBeenCalledWith(
      "/api/clients",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("should make POST requests with JSON body", async () => {
    const mockResponse = { id: "123" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const data = { name: "Test" };
    const result = await api.post("/clients", data);

    expect(fetch).toHaveBeenCalledWith(
      "/api/clients",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(data),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw ApiError on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Validation failed" }),
    } as Response);

    await expect(api.get("/bad-request")).rejects.toThrow(ApiError);
    await expect(api.get("/bad-request")).rejects.toThrow("Validation failed");
  });

  it("should handle non-JSON error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("Not JSON")),
    } as Response);

    await expect(api.get("/error")).rejects.toThrow(ApiError);
  });

  it("should make DELETE requests", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    await api.delete("/clients/123");

    expect(fetch).toHaveBeenCalledWith(
      "/api/clients/123",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
