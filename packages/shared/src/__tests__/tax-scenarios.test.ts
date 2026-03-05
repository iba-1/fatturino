/**
 * Multi-year tax scenarios from docs/tax-system-forfettario-gestione-separata.md
 *
 * These tests exercise the FULL calculation chain across multiple years:
 *   fatturato → coefficiente → reddito lordo → INPS → base imponibile → imposta → acconti
 *
 * All scenarios use:
 *   - Coefficiente di redditività: 78% (professionisti gestione separata)
 *   - INPS aliquota: 26,07%
 *   - ATECO code: 69.20 (consulenza, 78% coefficient)
 *
 * RED: These will fail because:
 *   - calcolaAccontoSaldo uses 50/50 instead of 40/60
 *   - calcolaAccontiInps doesn't exist
 *   - primoAnno flag doesn't exist on AccontoSaldoInput
 */
import { describe, it, expect } from "vitest";
import { calcolaImposta } from "../tax/imposta.js";
import { calcolaInps } from "../tax/inps.js";
import { calcolaAccontoSaldo } from "../tax/f24.js";
import { calcolaAccontiInps } from "../tax/f24.js";

const ATECO_PROFESSIONISTA = "69.20"; // Consulenza → 78%
const COEFFICIENTE = 78;

/** Helper: run the full chain for a single year */
function calcolaAnno(params: {
  fatturato: number;
  annoInizioAttivita: number;
  annoFiscale: number;
  contributiInpsVersatiNellanno: number;
}) {
  const inps = calcolaInps({
    fatturato: params.fatturato,
    codiceAteco: ATECO_PROFESSIONISTA,
    gestione: "separata",
  });

  const imposta = calcolaImposta({
    fatturato: params.fatturato,
    codiceAteco: ATECO_PROFESSIONISTA,
    contributiInpsVersati: params.contributiInpsVersatiNellanno,
    annoInizioAttivita: params.annoInizioAttivita,
    annoFiscale: params.annoFiscale,
  });

  return { inps, imposta };
}

describe("Scenario A — Primo Anno (€25.000, 5%, gestione separata)", () => {
  /**
   * Developer opens P.IVA in 2024 for the first time.
   * Year 1: no prior payments → no INPS deduction → no acconti.
   */

  it("calculates INPS for first year correctly", () => {
    const { inps } = calcolaAnno({
      fatturato: 25_000,
      annoInizioAttivita: 2024,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 0, // first year: nothing paid yet
    });

    // Reddito lordo = 25000 × 78% = 19500
    expect(inps.baseImponibile).toBe(19_500);
    // INPS = 19500 × 26.07% = 5083.65
    expect(inps.totaleDovuto).toBeCloseTo(5_084, 0);
  });

  it("calculates imposta sostitutiva with no INPS deduction in first year", () => {
    const { imposta } = calcolaAnno({
      fatturato: 25_000,
      annoInizioAttivita: 2024,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 0, // key: no INPS paid yet in year 1
    });

    // Base = 19500 − 0 = 19500 (no deduction first year!)
    expect(imposta.redditoImponibile).toBe(19_500);
    expect(imposta.isStartup).toBe(true);
    expect(imposta.aliquota).toBe(5);
    // Imposta = 19500 × 5% = 975
    expect(imposta.impostaDovuta).toBe(975);
  });

  it("has no acconti in first year (primoAnno = true)", () => {
    const { imposta, inps } = calcolaAnno({
      fatturato: 25_000,
      annoInizioAttivita: 2024,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 0,
    });

    // Imposta: primo anno → no acconti
    const accontiImposta = calcolaAccontoSaldo({
      impostaDovuta: imposta.impostaDovuta,
      accontiVersati: 0,
      anno: 2024,
      primoAnno: true,
    });
    expect(accontiImposta.primoAcconto).toBe(0);
    expect(accontiImposta.secondoAcconto).toBe(0);
    expect(accontiImposta.saldo).toBe(975);

    // INPS: primo anno → no acconti
    const accontiInps = calcolaAccontiInps({
      inpsPrecedente: 0,
      inpsEffettivo: inps.totaleDovuto,
      primoAnno: true,
    });
    expect(accontiInps.primoAcconto).toBe(0);
    expect(accontiInps.secondoAcconto).toBe(0);
    expect(accontiInps.saldo).toBeCloseTo(5_084, 0);
  });

  it("total June payment (year 2) matches spec: ~€8.483", () => {
    const { imposta, inps } = calcolaAnno({
      fatturato: 25_000,
      annoInizioAttivita: 2024,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 0,
    });

    // June of year 2: saldo anno 1 + primo acconto anno 2
    const saldoINPS = inps.totaleDovuto; // full amount (no acconti paid)
    const saldoImposta = imposta.impostaDovuta; // full amount

    // Primo acconto year 2 is based on year 1's actual
    const accontiImpostaY2 = calcolaAccontoSaldo({
      impostaDovuta: imposta.impostaDovuta,
      accontiVersati: 0,
      anno: 2025,
    });
    const accontiInpsY2 = calcolaAccontiInps({
      inpsPrecedente: inps.totaleDovuto,
    });

    const juneTotal =
      saldoINPS +
      saldoImposta +
      accontiInpsY2.primoAcconto +
      accontiImpostaY2.primoAcconto;

    // Spec: €8.483 (saldo INPS 5084 + saldo imposta 975 + acc INPS 2034 + acc imposta 390)
    expect(juneTotal).toBeCloseTo(8_483, -1);
  });
});

describe("Scenario B — Stable €35.000 (15%, gestione separata)", () => {
  /**
   * Professional operating for 6+ years, stable income.
   * INPS deduction from prior year available.
   */

  it("calculates full chain for stable year", () => {
    // Prior year INPS paid at June = €7.117 (same income level)
    const { inps, imposta } = calcolaAnno({
      fatturato: 35_000,
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 7_117, // prior year INPS paid this year
    });

    expect(inps.baseImponibile).toBe(27_300);
    expect(inps.totaleDovuto).toBeCloseTo(7_117, 0);

    expect(imposta.redditoImponibile).toBeCloseTo(20_183, 0);
    expect(imposta.aliquota).toBe(15);
    expect(imposta.impostaDovuta).toBeCloseTo(3_027, 0);
  });

  it("tax burden is ~29% of fatturato", () => {
    const { inps, imposta } = calcolaAnno({
      fatturato: 35_000,
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 7_117,
    });

    const totalBurden = inps.totaleDovuto + imposta.impostaDovuta;
    const percentage = (totalBurden / 35_000) * 100;

    expect(percentage).toBeCloseTo(29.0, 0);
  });

  it("acconti imposta use 40/60 split", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 3_027,
      accontiVersati: 0,
      anno: 2025,
    });

    expect(result.primoAcconto).toBeCloseTo(1_211, 0);  // 40%
    expect(result.secondoAcconto).toBeCloseTo(1_816, 0); // 60%
  });

  it("acconti INPS use 80%/40-40 split", () => {
    const result = calcolaAccontiInps({ inpsPrecedente: 7_117 });

    expect(result.primoAcconto).toBeCloseTo(2_847, 0);  // 40% of total
    expect(result.secondoAcconto).toBeCloseTo(2_847, 0); // 40% of total
    expect(result.totaleAcconti).toBeCloseTo(5_694, 0);  // 80% total
  });
});

describe("Scenario C — Revenue Growth (€20k → €35k)", () => {
  /**
   * Year 2023: €20.000 fatturato
   * Year 2024: €35.000 fatturato
   * Acconti 2024 were based on 2023's lower amounts → high saldo at June 2025
   */

  it("saldo INPS is high because acconti were based on lower income", () => {
    const inps2023 = calcolaInps({
      fatturato: 20_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      gestione: "separata",
    });
    const inps2024 = calcolaInps({
      fatturato: 35_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      gestione: "separata",
    });

    // Acconti paid for 2024 were based on 2023: 80% of €4.067
    const accontiPaid2024 = inps2023.totaleDovuto * 0.8;
    // Saldo = actual 2024 − acconti paid
    const saldo = inps2024.totaleDovuto - accontiPaid2024;

    // Spec: €7.117 − €3.254 = €3.863
    expect(saldo).toBeCloseTo(3_863, -1);
  });

  it("saldo imposta is high for same reason", () => {
    // 2023 imposta (deducting 2022 INPS — assume same level as 2023 for simplicity)
    const imposta2023 = calcolaImposta({
      fatturato: 20_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      contributiInpsVersati: 4_067, // assume prior year INPS ≈ 2023 level
      annoInizioAttivita: 2018,
      annoFiscale: 2023,
    });

    // 2024 imposta (deducting 2023 INPS paid at June 2024)
    const imposta2024 = calcolaImposta({
      fatturato: 35_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      contributiInpsVersati: 4_067, // 2023 INPS paid in 2024
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
    });

    // Acconti paid for 2024 = 100% of 2023's imposta
    const accontiPaid2024 = imposta2023.impostaDovuta;
    const saldo = imposta2024.impostaDovuta - accontiPaid2024;

    // Should be positive — income grew
    expect(saldo).toBeGreaterThan(0);
    // Spec: €3.485 − €1.730 = €1.755
    expect(saldo).toBeCloseTo(1_755, 0);
  });
});

describe("Scenario D — Revenue Decline (€40k → €25k)", () => {
  /**
   * Year 2023: €40.000
   * Year 2024: €25.000
   * Result: overpaid acconti → credits
   */

  it("INPS saldo is negative (credit) when income drops", () => {
    const inps2023 = calcolaInps({
      fatturato: 40_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      gestione: "separata",
    });
    const inps2024 = calcolaInps({
      fatturato: 25_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      gestione: "separata",
    });

    const accontiPaid2024 = inps2023.totaleDovuto * 0.8;
    const saldo = inps2024.totaleDovuto - accontiPaid2024;

    // Spec: €5.084 − €6.507 = −€1.423
    expect(saldo).toBeLessThan(0);
    expect(saldo).toBeCloseTo(-1_423, 0);
  });

  it("imposta saldo is also negative (credit)", () => {
    const imposta2023 = calcolaImposta({
      fatturato: 40_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      contributiInpsVersati: 8_134, // assume same level
      annoInizioAttivita: 2018,
      annoFiscale: 2023,
    });
    const imposta2024 = calcolaImposta({
      fatturato: 25_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      contributiInpsVersati: 8_134, // 2023 INPS paid in 2024
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
    });

    const accontiPaid2024 = imposta2023.impostaDovuta;
    const saldo = imposta2024.impostaDovuta - accontiPaid2024;

    // Should be negative — income dropped
    expect(saldo).toBeLessThan(0);
    // Spec: €1.705 − €3.460 = −€1.755
    expect(saldo).toBeCloseTo(-1_755, 0);
  });
});

describe("Scenario E — Low Revenue (€10.000)", () => {
  /**
   * Minimal activity. No minimale for gestione separata — pays proportionally.
   */

  it("INPS is proportionally low (no minimale)", () => {
    const { inps } = calcolaAnno({
      fatturato: 10_000,
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 2_033,
    });

    // 10000 × 78% = 7800
    expect(inps.baseImponibile).toBe(7_800);
    // 7800 × 26.07% = 2033.46
    expect(inps.totaleDovuto).toBeCloseTo(2_033, 0);
    expect(inps.contributoFisso).toBe(0); // no minimale in gestione separata
  });

  it("monthly accantonamento is ~€241 at 15%", () => {
    const { inps, imposta } = calcolaAnno({
      fatturato: 10_000,
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 2_033,
    });

    const monthlyAccantonamento = (inps.totaleDovuto + imposta.impostaDovuta) / 12;
    expect(monthlyAccantonamento).toBeCloseTo(241, -1);
  });

  it("imposta exceeds €257.52 threshold → two acconti (40/60)", () => {
    const { imposta } = calcolaAnno({
      fatturato: 10_000,
      annoInizioAttivita: 2018,
      annoFiscale: 2024,
      contributiInpsVersatiNellanno: 2_033,
    });

    // Imposta = (7800 − 2033) × 15% = 5767 × 15% = 865.05
    expect(imposta.impostaDovuta).toBeCloseTo(865, 0);

    // > €257.52 → two payments
    const acconti = calcolaAccontoSaldo({
      impostaDovuta: imposta.impostaDovuta,
      accontiVersati: 0,
      anno: 2025,
    });

    expect(acconti.primoAcconto).toBeCloseTo(346, 0);   // 40%
    expect(acconti.secondoAcconto).toBeCloseTo(519, 0);  // 60%
  });
});

describe("INPS deductibility asynchrony", () => {
  /**
   * The spec emphasizes: INPS contributions are deducted based on
   * the CASH PRINCIPLE — you deduct what you PAID in the fiscal year,
   * not what was owed. This creates a one-year lag.
   */

  it("first year: no INPS deduction (nothing paid yet)", () => {
    // Year 1 (2024): open P.IVA, earn €25k, pay nothing during year
    const imposta = calcolaImposta({
      fatturato: 25_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      contributiInpsVersati: 0, // nothing paid yet
      annoInizioAttivita: 2024,
      annoFiscale: 2024,
    });

    // Base = 19500 − 0 = 19500 (full reddito, no deduction)
    expect(imposta.redditoImponibile).toBe(19_500);
    expect(imposta.impostaDovuta).toBe(975); // 19500 × 5%
  });

  it("second year: deducts year 1 INPS (paid at June of year 2)", () => {
    // Year 2 (2025): same fatturato, but now you paid INPS 2024 (saldo + acconti)
    // INPS paid in 2025: saldo 2024 (5084) + primo acconto 2025 (2034) + secondo acconto 2025 (2034)
    // But for the 2025 dichiarazione: contributiInpsVersati = everything paid in 2025
    const inpsPaidIn2025 = 5_084 + 2_034 + 2_034; // €9.152

    const imposta = calcolaImposta({
      fatturato: 25_000,
      codiceAteco: ATECO_PROFESSIONISTA,
      contributiInpsVersati: inpsPaidIn2025,
      annoInizioAttivita: 2024,
      annoFiscale: 2025,
    });

    // Base = 19500 − 9152 = 10348
    expect(imposta.redditoImponibile).toBe(10_348);
    // 10348 × 5% = 517.40
    expect(imposta.impostaDovuta).toBeCloseTo(517, 0);
    // Much lower than year 1's €975!
  });
});
