/**
 * Tests for imposta sostitutiva acconto calculation.
 *
 * Spec (docs/tax-system-forfettario-gestione-separata.md):
 *   - Primo acconto: 40% of prior year's imposta (due June 30)
 *   - Secondo acconto: 60% of prior year's imposta (due November 30)
 *   - Threshold < €52: no acconti at all
 *   - Threshold €52–€257.52: single payment (secondoAcconto only, novembre)
 *   - Threshold > €257.52: two payments (40/60 split)
 *   - First year of activity: no acconti (no prior year reference)
 *
 * RED: These tests expose the bug in calcolaAccontoSaldo (currently uses 50/50 split)
 *      and the missing single-payment threshold band.
 */
import { describe, it, expect } from "vitest";
import { calcolaAccontoSaldo, SOGLIA_MINIMA_ACCONTI } from "../tax/f24.js";

describe("calcolaAccontoSaldo — split 40/60 (imposta sostitutiva)", () => {
  it("splits imposta into 40% primo acconto and 60% secondo acconto", () => {
    // Spec: primo = 40%, secondo = 60% of prior year's imposta sostitutiva
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1_000,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(400);   // 40% — NOT 500
    expect(result.secondoAcconto).toBe(600); // 60% — NOT 500
  });

  it("applies 40/60 split on a professional earning €35k (Scenario B from spec)", () => {
    // Spec Scenario B: €35.000 fatturato, 78% coeff, 15% aliquota
    // Reddito lordo = 27.300, INPS = 7.117, Base = ~20.183, Imposta = ~3.027
    const impostaDovuta = 3_027;

    const result = calcolaAccontoSaldo({
      impostaDovuta,
      accontiVersati: 0,
      anno: 2025,
    });

    expect(result.primoAcconto).toBeCloseTo(1_210.8, 0); // 40%
    expect(result.secondoAcconto).toBeCloseTo(1_816.2, 0); // 60%
  });

  it("rounds correctly when 40/60 produces fractional cents", () => {
    // €1.425 → 40% = 570, 60% = 855
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1_425,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(570);
    expect(result.secondoAcconto).toBe(855);
  });

  it("primo + secondo = impostaDovuta when no acconti previously paid", () => {
    const impostaDovuta = 2_873;
    const result = calcolaAccontoSaldo({
      impostaDovuta,
      accontiVersati: 0,
      anno: 2024,
    });

    // The sum of acconti must equal the total (within rounding)
    const total = result.primoAcconto + result.secondoAcconto;
    expect(total).toBeCloseTo(impostaDovuta, 1);
  });
});

describe("calcolaAccontoSaldo — soglie (thresholds)", () => {
  it("charges no acconti when impostaDovuta is below €51.65 threshold", () => {
    // Legal threshold: €51.65 (SOGLIA_MINIMA_ACCONTI)
    const result = calcolaAccontoSaldo({
      impostaDovuta: 51.64,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
  });

  it("charges no acconti when impostaDovuta is exactly €52 boundary (below threshold)", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 50,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
  });

  it("charges single payment (secondo only) when imposta is between €52 and €257.52", () => {
    // Spec: €52–€257.52 → unico acconto entro 30 novembre (secondoAcconto only)
    const result = calcolaAccontoSaldo({
      impostaDovuta: 150,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(0);       // No June payment
    expect(result.secondoAcconto).toBe(150);   // Full amount in November
  });

  it("charges single payment when imposta is exactly €257.52 (upper boundary inclusive)", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 257.52,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(257.52);
  });

  it("charges two payments with 40/60 split when imposta exceeds €257.52", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 258,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBeCloseTo(103.2, 1);  // 40%
    expect(result.secondoAcconto).toBeCloseTo(154.8, 1); // 60%
  });
});

describe("calcolaAccontoSaldo — saldo with prior acconti", () => {
  it("computes saldo = impostaDovuta − accontiVersati", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 3_000,
      accontiVersati: 1_000,
      anno: 2024,
    });

    expect(result.saldo).toBe(2_000);
  });

  it("saldo is zero (not negative) when overpaid", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1_000,
      accontiVersati: 1_500,
      anno: 2024,
    });

    expect(result.saldo).toBe(0);
  });

  it("saldo is zero when exactly right amount paid", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 2_000,
      accontiVersati: 2_000,
      anno: 2024,
    });

    expect(result.saldo).toBe(0);
  });
});

describe("calcolaAccontoSaldo — primo anno (first year exemption)", () => {
  it("returns zero acconti when primoAnno is true (no prior year reference)", () => {
    // Spec: primo anno → no acconti during the year itself.
    // Only saldo is due (at June 30 of the following year).
    // primoAnno flag signals this is the first year — no basis for acconti.
    const result = calcolaAccontoSaldo({
      impostaDovuta: 975, // Based on Scenario A: €25k × 78% × 5% (no INPS deduction year 1)
      accontiVersati: 0,
      anno: 2024,
      primoAnno: true,
    });

    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
    expect(result.saldo).toBe(975); // Full amount due as saldo only
  });
});
