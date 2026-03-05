/**
 * Tests for INPS Gestione Separata acconto calculation.
 *
 * Spec (docs/tax-system-forfettario-gestione-separata.md):
 *   - Acconti INPS = 80% of prior year's INPS total
 *   - Split: 40% primo (June 30) + 40% secondo (November 30) = 80%
 *   - Saldo = actual INPS − acconti paid (at June 30 of following year)
 *   - First year: no acconti (no prior year reference)
 *
 * RED: calcolaAccontiInps does not exist yet — all tests will fail with import error.
 */
import { describe, it, expect } from "vitest";
import { calcolaAccontiInps } from "../tax/f24.js";

describe("calcolaAccontiInps — 80% rule, 40/40 split", () => {
  it("computes total acconti as 80% of prior year INPS", () => {
    // Spec: acconti = INPS anno precedente × 80%
    const result = calcolaAccontiInps({ inpsPrecedente: 7_117 });

    const totale = result.primoAcconto + result.secondoAcconto;
    expect(totale).toBeCloseTo(7_117 * 0.8, 1); // 5693.60
  });

  it("splits acconti into equal 40/40 halves", () => {
    // Spec: primo acconto = 40% of prior year, secondo = 40%
    const result = calcolaAccontiInps({ inpsPrecedente: 7_117 });

    expect(result.primoAcconto).toBeCloseTo(2_846.8, 1);  // 40%
    expect(result.secondoAcconto).toBeCloseTo(2_846.8, 1); // 40%
  });

  it("primo and secondo are equal (symmetric split)", () => {
    const result = calcolaAccontiInps({ inpsPrecedente: 5_084 });

    expect(result.primoAcconto).toBe(result.secondoAcconto);
  });

  it("handles Scenario B: stable €35k professional", () => {
    // From spec Scenario B: INPS = €7.117
    const result = calcolaAccontiInps({ inpsPrecedente: 7_117 });

    expect(result.primoAcconto).toBeCloseTo(2_847, 0);
    expect(result.secondoAcconto).toBeCloseTo(2_847, 0);
    expect(result.totaleAcconti).toBeCloseTo(5_694, 0);
  });

  it("handles small INPS amounts correctly", () => {
    const result = calcolaAccontiInps({ inpsPrecedente: 100 });

    expect(result.primoAcconto).toBe(40);   // 40%
    expect(result.secondoAcconto).toBe(40); // 40%
    expect(result.totaleAcconti).toBe(80);  // 80%
  });

  it("returns zero acconti when prior year INPS is zero", () => {
    const result = calcolaAccontiInps({ inpsPrecedente: 0 });

    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
    expect(result.totaleAcconti).toBe(0);
  });
});

describe("calcolaAccontiInps — saldo calculation", () => {
  it("computes saldo as actual INPS minus acconti paid", () => {
    // Stable year: actual = prior, acconti = 80% of prior → saldo = 20%
    const result = calcolaAccontiInps({
      inpsPrecedente: 5_084,
      inpsEffettivo: 5_084,
    });

    // Acconti paid: 5084 × 80% = 4067.20
    // Saldo: 5084 − 4067.20 = 1016.80
    expect(result.saldo).toBeCloseTo(1_016.8, 1);
  });

  it("saldo is negative (credit) when income drops", () => {
    // Scenario D: prior €8.134, actual €5.084
    const result = calcolaAccontiInps({
      inpsPrecedente: 8_134,
      inpsEffettivo: 5_084,
    });

    // Acconti paid: 8134 × 80% = 6507.20
    // Saldo: 5084 − 6507.20 = −1423.20 → credit
    expect(result.saldo).toBeCloseTo(-1_423.2, 1);
  });

  it("saldo is positive when income grows", () => {
    // Scenario C: prior €4.067, actual €7.117
    const result = calcolaAccontiInps({
      inpsPrecedente: 4_067,
      inpsEffettivo: 7_117,
    });

    // Acconti paid: 4067 × 80% = 3253.60
    // Saldo: 7117 − 3253.60 = 3863.40
    expect(result.saldo).toBeCloseTo(3_863.4, 1);
  });

  it("saldo is zero when overpaid but capped at zero (no negative saldo)", () => {
    // Optional: some implementations cap saldo at 0 and return credit separately
    // This test documents the expected behavior — adjust based on design choice
    const result = calcolaAccontiInps({
      inpsPrecedente: 8_134,
      inpsEffettivo: 5_084,
    });

    // For INPS, unlike imposta, negative saldo = credit (rimborsabile o compensabile)
    // The function should return the raw difference, not capped
    expect(result.saldo).toBeLessThan(0);
  });
});

describe("calcolaAccontiInps — primo anno (first year)", () => {
  it("returns zero acconti when primoAnno is true", () => {
    // First year: no prior year reference → no acconti
    const result = calcolaAccontiInps({
      inpsPrecedente: 0,
      primoAnno: true,
    });

    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
    expect(result.totaleAcconti).toBe(0);
  });

  it("saldo equals full INPS when first year (no acconti were paid)", () => {
    // Scenario A: primo anno, INPS 2024 = €5.084, no acconti paid
    const result = calcolaAccontiInps({
      inpsPrecedente: 0,
      inpsEffettivo: 5_084,
      primoAnno: true,
    });

    expect(result.saldo).toBe(5_084);
  });
});
