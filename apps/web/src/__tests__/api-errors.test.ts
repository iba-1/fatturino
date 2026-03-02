import { describe, it, expect } from "vitest";
import { ApiError, parseApiFieldErrors } from "../lib/api";

describe("parseApiFieldErrors", () => {
  it("maps Zod-shaped details to { fieldName: message } record", () => {
    const error = new ApiError(422, "Validation failed", [
      {
        validation: "regex",
        code: "invalid_string",
        message: "Invalid codice fiscale format",
        path: ["codiceFiscale"],
      },
      {
        code: "too_small",
        message: "String must contain at least 1 character(s)",
        path: ["ragioneSociale"],
      },
    ]);

    expect(parseApiFieldErrors(error)).toEqual({
      codiceFiscale: "Invalid codice fiscale format",
      ragioneSociale: "String must contain at least 1 character(s)",
    });
  });

  it("returns {} for non-ApiError", () => {
    expect(parseApiFieldErrors(new Error("generic"))).toEqual({});
    expect(parseApiFieldErrors("string error")).toEqual({});
    expect(parseApiFieldErrors(null)).toEqual({});
    expect(parseApiFieldErrors(undefined)).toEqual({});
  });

  it("returns {} when details is not an array", () => {
    const error = new ApiError(422, "Validation failed", "not an array");
    expect(parseApiFieldErrors(error)).toEqual({});
  });

  it("returns {} when details is undefined", () => {
    const error = new ApiError(500, "Server error");
    expect(parseApiFieldErrors(error)).toEqual({});
  });

  it("skips entries without path", () => {
    const error = new ApiError(422, "Validation failed", [
      { message: "Something went wrong" },
      { message: "Missing field", path: [] },
      {
        message: "Valid error",
        path: ["email"],
      },
    ]);

    expect(parseApiFieldErrors(error)).toEqual({
      email: "Valid error",
    });
  });
});
