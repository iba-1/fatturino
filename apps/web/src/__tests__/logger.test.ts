import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logger.error logs with console.error including event name and context", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const context = { userId: "u1", action: "login" };

    logger.error("auth.failed", context);

    expect(spy).toHaveBeenCalledWith("[ERROR] auth.failed", context);
  });

  it("logger.warn logs with console.warn including event name and context", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const context = { retryCount: 3 };

    logger.warn("api.retry", context);

    expect(spy).toHaveBeenCalledWith("[WARN] api.retry", context);
  });

  it("logger.info logs with console.info including event name and context", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const context = { invoiceId: "inv-1" };

    logger.info("invoice.created", context);

    expect(spy).toHaveBeenCalledWith("[INFO] invoice.created", context);
  });

  it("logs with empty object when no context is provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("app.crash");

    expect(spy).toHaveBeenCalledWith("[ERROR] app.crash", {});
  });
});
