import { describe, it, expect } from "vitest";
import { calcolaImposta } from "../tax/imposta.js";

describe("calcolaImposta", () => {
  it("should calculate tax for a software developer in startup period (5%)", () => {
    const result = calcolaImposta({
      fatturato: 50_000,
      codiceAteco: "62.01",
      contributiInpsVersati: 5_000,
      annoInizioAttivita: 2022,
      annoFiscale: 2024,
    });

    // Reddito lordo = 50000 × 67% = 33500
    expect(result.coefficienteRedditivita).toBe(67);
    expect(result.redditoLordo).toBe(33_500);

    // Reddito imponibile = 33500 − 5000 = 28500
    expect(result.redditoImponibile).toBe(28_500);

    // Startup (< 5 years) → 5%
    expect(result.isStartup).toBe(true);
    expect(result.aliquota).toBe(5);

    // Imposta = 28500 × 5% = 1425
    expect(result.impostaDovuta).toBe(1_425);
  });

  it("should calculate tax for an established professional (15%)", () => {
    const result = calcolaImposta({
      fatturato: 60_000,
      codiceAteco: "69.10", // Legal services → 78%
      contributiInpsVersati: 8_000,
      annoInizioAttivita: 2015,
      annoFiscale: 2024,
    });

    // Reddito lordo = 60000 × 78% = 46800
    expect(result.redditoLordo).toBe(46_800);

    // Reddito imponibile = 46800 − 8000 = 38800
    expect(result.redditoImponibile).toBe(38_800);

    // Not startup (>= 5 years) → 15%
    expect(result.isStartup).toBe(false);
    expect(result.aliquota).toBe(15);

    // Imposta = 38800 × 15% = 5820
    expect(result.impostaDovuta).toBe(5_820);
  });

  it("should not go below zero for reddito imponibile", () => {
    const result = calcolaImposta({
      fatturato: 10_000,
      codiceAteco: "62.01", // 67%
      contributiInpsVersati: 20_000, // More than reddito lordo
      annoInizioAttivita: 2020,
      annoFiscale: 2024,
    });

    // Reddito lordo = 10000 × 67% = 6700
    expect(result.redditoLordo).toBe(6_700);
    // Reddito imponibile should be 0, not negative
    expect(result.redditoImponibile).toBe(0);
    expect(result.impostaDovuta).toBe(0);
  });

  it("should be exactly at year 5 boundary (5 years active → NOT startup)", () => {
    const result = calcolaImposta({
      fatturato: 30_000,
      codiceAteco: "62.01",
      contributiInpsVersati: 3_000,
      annoInizioAttivita: 2019,
      annoFiscale: 2024,
    });

    // 2024 - 2019 = 5, which is >= 5 → not startup
    expect(result.isStartup).toBe(false);
    expect(result.aliquota).toBe(15);
  });

  it("should throw for unknown ATECO code", () => {
    expect(() =>
      calcolaImposta({
        fatturato: 30_000,
        codiceAteco: "00.00",
        contributiInpsVersati: 3_000,
        annoInizioAttivita: 2020,
        annoFiscale: 2024,
      })
    ).toThrow("Unknown ATECO code");
  });

  it("should handle zero fatturato", () => {
    const result = calcolaImposta({
      fatturato: 0,
      codiceAteco: "62.01",
      contributiInpsVersati: 0,
      annoInizioAttivita: 2020,
      annoFiscale: 2024,
    });

    expect(result.redditoLordo).toBe(0);
    expect(result.redditoImponibile).toBe(0);
    expect(result.impostaDovuta).toBe(0);
  });
});
