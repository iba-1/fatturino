import { describe, it, expect } from "vitest";
import { getCoefficiente, COEFFICIENTI_REDDITIVITA } from "../tax/coefficienti.js";

describe("getCoefficiente", () => {
  it("should return 78 for professional services (ATECO 69 - legal/accounting)", () => {
    expect(getCoefficiente("69.10")).toBe(78);
  });

  it("should return 67 for software/IT consulting (ATECO 62)", () => {
    // ATECO 62 = Produzione di software, consulenza informatica → 67%
    expect(getCoefficiente("62.01")).toBe(67);
  });

  it("should return 40 for food/drink commerce (ATECO 47)", () => {
    expect(getCoefficiente("47.11")).toBe(40);
  });

  it("should return 54 for ambulante other products (ATECO 47.82)", () => {
    expect(getCoefficiente("47.82")).toBe(54);
  });

  it("should use longest prefix match (47.82 → 54 instead of 47 → 40)", () => {
    expect(getCoefficiente("47.82")).toBe(54);
    expect(getCoefficiente("47.89")).toBe(54);
  });

  it("should return 86 for construction (ATECO 41)", () => {
    expect(getCoefficiente("41.20")).toBe(86);
  });

  it("should return 40 for food industry (ATECO 10)", () => {
    expect(getCoefficiente("10.11")).toBe(40);
  });

  it("should return null for unknown ATECO code", () => {
    expect(getCoefficiente("00.00")).toBe(null);
  });

  it("should handle codes without dots", () => {
    expect(getCoefficiente("6201")).toBe(67);
  });

  it("should have entries in the COEFFICIENTI_REDDITIVITA table", () => {
    expect(COEFFICIENTI_REDDITIVITA.length).toBeGreaterThan(0);
  });
});
