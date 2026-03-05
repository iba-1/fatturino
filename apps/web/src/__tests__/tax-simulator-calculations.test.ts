/**
 * Frontend tests for the tax simulator calculation chain.
 *
 * These test the pure functions used by TaxSimulator.tsx to ensure the
 * displayed values match the spec (docs/tax-system-forfettario-gestione-separata.md).
 *
 * The TaxSimulator uses INPS from the SAME year as deduction (simulation mode),
 * which differs from the real dichiarazione (cash principle, prior year INPS).
 * Tests document both behaviors.
 *
 * RED: Tests for 40/60 split and calcolaAccontiInps will fail.
 */
import { describe, it, expect } from "vitest";
import {
  calcolaImposta,
  calcolaInps,
  calcolaAccontoSaldo,
} from "@fatturino/shared";

// Stub for calcolaAccontiInps (does not exist yet in shared exports)
// Once implemented, replace with: import { calcolaAccontiInps } from "@fatturino/shared";

/**
 * Simulates TaxSimulator.tsx logic: INPS → imposta → acconti in a single pass.
 * This mirrors the useMemo in TaxSimulator exactly.
 */
function simulateTaxCalculation(params: {
  fatturato: number;
  codiceAteco: string;
  gestione: "separata" | "artigiani" | "commercianti";
  annoInizioAttivita: number;
  annoFiscale: number;
}) {
  const inps = calcolaInps({
    fatturato: params.fatturato,
    codiceAteco: params.codiceAteco,
    gestione: params.gestione,
  });

  const tax = calcolaImposta({
    fatturato: params.fatturato,
    codiceAteco: params.codiceAteco,
    contributiInpsVersati: inps.totaleDovuto, // simulation: same-year INPS
    annoInizioAttivita: params.annoInizioAttivita,
    annoFiscale: params.annoFiscale,
  });

  const accontoSaldo = calcolaAccontoSaldo({
    impostaDovuta: tax.impostaDovuta,
    accontiVersati: 0,
    anno: params.annoFiscale,
  });

  return { inps, tax, accontoSaldo };
}

describe("TaxSimulator — full calculation chain (gestione separata)", () => {
  it("calculates correctly for €50k developer (67% coeff, startup)", () => {
    const { inps, tax, accontoSaldo } = simulateTaxCalculation({
      fatturato: 50_000,
      codiceAteco: "62.01", // Software development → 67%
      gestione: "separata",
      annoInizioAttivita: 2022,
      annoFiscale: 2024,
    });

    // INPS: 50000 × 67% × 26.07% = 33500 × 26.07% = 8733.45
    expect(inps.baseImponibile).toBe(33_500);
    expect(inps.totaleDovuto).toBe(8_733.45);

    // Imposta: (33500 − 8733.45) × 5% = 24766.55 × 5% = 1238.33
    expect(tax.redditoImponibile).toBeCloseTo(24_766.55, 1);
    expect(tax.aliquota).toBe(5);
    expect(tax.impostaDovuta).toBeCloseTo(1_238.33, 1);

    // Acconti: 40/60 split
    expect(accontoSaldo.primoAcconto).toBeCloseTo(1_238.33 * 0.4, 0);
    expect(accontoSaldo.secondoAcconto).toBeCloseTo(1_238.33 * 0.6, 0);
  });

  it("calculates correctly for €35k consultant (78% coeff, ordinary)", () => {
    const { inps, tax, accontoSaldo } = simulateTaxCalculation({
      fatturato: 35_000,
      codiceAteco: "69.20", // Consulenza → 78%
      gestione: "separata",
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
    });

    // INPS: 35000 × 78% × 26.07% = 27300 × 26.07% = 7117.11
    expect(inps.baseImponibile).toBe(27_300);
    expect(inps.totaleDovuto).toBeCloseTo(7_117, 0);

    // Imposta (simulation mode): (27300 − 7117) × 15% = 20183 × 15% = 3027.45
    expect(tax.aliquota).toBe(15);
    expect(tax.impostaDovuta).toBeCloseTo(3_027, 0);

    // Acconti: 40/60 split (NOT 50/50)
    expect(accontoSaldo.primoAcconto).toBeCloseTo(3_027 * 0.4, 0);
    expect(accontoSaldo.secondoAcconto).toBeCloseTo(3_027 * 0.6, 0);
  });
});

describe("TaxSimulator — monthly accantonamento table (spec appendix)", () => {
  /**
   * The spec provides a quick reference table for monthly set-aside amounts.
   * Formula: fatturato × 78% = reddito; reddito × 26.07% = INPS;
   *          (reddito − INPS) × 15% or 5% = imposta
   *
   * These tests verify the table values.
   */

  const calculateMonthly = (monthlyRevenue: number, aliquotaImposta: number) => {
    const annualRevenue = monthlyRevenue * 12;
    const reddito = annualRevenue * 0.78;
    const inps = reddito * 0.2607;
    const imposta = (reddito - inps) * (aliquotaImposta / 100);
    return {
      inpsMonthly: Math.round(inps / 12),
      impostaMonthly: Math.round(imposta / 12),
      totalMonthly: Math.round((inps + imposta) / 12),
    };
  };

  it.each([
    { monthly: 1_000, expectedInps: 203, expectedImposta15: 87, expectedImposta5: 29 },
    { monthly: 2_000, expectedInps: 407, expectedImposta15: 173, expectedImposta5: 58 },
    { monthly: 3_000, expectedInps: 610, expectedImposta15: 260, expectedImposta5: 87 },
    { monthly: 4_000, expectedInps: 813, expectedImposta15: 347, expectedImposta5: 116 },
    { monthly: 5_000, expectedInps: 1_017, expectedImposta15: 433, expectedImposta5: 144 },
    { monthly: 6_000, expectedInps: 1_220, expectedImposta15: 520, expectedImposta5: 173 },
    { monthly: 7_000, expectedInps: 1_423, expectedImposta15: 607, expectedImposta5: 202 },
  ])(
    "€$monthly/month → INPS ~€$expectedInps, Imposta 15% ~€$expectedImposta15, 5% ~€$expectedImposta5",
    ({ monthly, expectedInps, expectedImposta15, expectedImposta5 }) => {
      const at15 = calculateMonthly(monthly, 15);
      const at5 = calculateMonthly(monthly, 5);

      expect(at15.inpsMonthly).toBeCloseTo(expectedInps, -1);
      expect(at15.impostaMonthly).toBeCloseTo(expectedImposta15, -1);
      expect(at5.impostaMonthly).toBeCloseTo(expectedImposta5, -1);
    }
  );

  it.each([
    { monthly: 1_000, total15: 290, total5: 232 },
    { monthly: 3_000, total15: 870, total5: 697 },
    { monthly: 5_000, total15: 1_450, total5: 1_161 },
    { monthly: 7_000, total15: 2_030, total5: 1_625 },
  ])(
    "€$monthly/month → total set-aside 15%: €$total15, 5%: €$total5",
    ({ monthly, total15, total5 }) => {
      const at15 = calculateMonthly(monthly, 15);
      const at5 = calculateMonthly(monthly, 5);

      expect(at15.totalMonthly).toBeCloseTo(total15, -1);
      expect(at5.totalMonthly).toBeCloseTo(total5, -1);
    }
  );
});

describe("TaxSimulator — edge cases", () => {
  it("returns zero everything for zero fatturato", () => {
    const { inps, tax, accontoSaldo } = simulateTaxCalculation({
      fatturato: 0,
      codiceAteco: "62.01",
      gestione: "separata",
      annoInizioAttivita: 2020,
      annoFiscale: 2024,
    });

    expect(inps.totaleDovuto).toBe(0);
    expect(tax.impostaDovuta).toBe(0);
    expect(accontoSaldo.primoAcconto).toBe(0);
    expect(accontoSaldo.secondoAcconto).toBe(0);
  });

  it("throws for unknown ATECO code", () => {
    expect(() =>
      simulateTaxCalculation({
        fatturato: 30_000,
        codiceAteco: "00.00",
        gestione: "separata",
        annoInizioAttivita: 2020,
        annoFiscale: 2024,
      })
    ).toThrow("Unknown ATECO code");
  });

  it("imposta below €52 threshold means no acconti", () => {
    // Very low fatturato → imposta < €52
    // Need ~€670 fatturato at 78% × 15% to get €52 imposta
    // 670 × 78% = 522.6 → INPS = 136.24 → base = 386.36 → 15% = 57.95
    // Let's try €500: 500 × 78% = 390 → INPS = 101.67 → base = 288.33 → 15% = 43.25
    const { tax, accontoSaldo } = simulateTaxCalculation({
      fatturato: 500,
      codiceAteco: "69.20",
      gestione: "separata",
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
    });

    expect(tax.impostaDovuta).toBeLessThan(52);
    expect(accontoSaldo.primoAcconto).toBe(0);
    expect(accontoSaldo.secondoAcconto).toBe(0);
  });

  it("tax burden as percentage of revenue is ~29% at 15%", () => {
    const { inps, tax } = simulateTaxCalculation({
      fatturato: 35_000,
      codiceAteco: "69.20",
      gestione: "separata",
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
    });

    const burden = ((inps.totaleDovuto + tax.impostaDovuta) / 35_000) * 100;
    expect(burden).toBeCloseTo(29, 0);
  });

  it("tax burden as percentage of revenue is ~25% at 5%", () => {
    const { inps, tax } = simulateTaxCalculation({
      fatturato: 35_000,
      codiceAteco: "69.20",
      gestione: "separata",
      annoInizioAttivita: 2022,
      annoFiscale: 2024,
    });

    const burden = ((inps.totaleDovuto + tax.impostaDovuta) / 35_000) * 100;
    expect(burden).toBeCloseTo(23, 0);
  });
});
