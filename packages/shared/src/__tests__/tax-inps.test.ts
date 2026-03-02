import { describe, it, expect } from "vitest";
import { calcolaInps } from "../tax/inps.js";

describe("calcolaInps - Gestione Separata", () => {
  it("should calculate INPS for professionisti senza cassa", () => {
    const result = calcolaInps({
      fatturato: 50_000,
      codiceAteco: "62.01", // 67%
      gestione: "separata",
    });

    // Base imponibile = 50000 × 67% = 33500
    expect(result.baseImponibile).toBe(33_500);
    expect(result.aliquota).toBe(26.07);

    // Contributo = 33500 × 26.07% = 8733.45
    expect(result.totaleDovuto).toBe(8_733.45);
    expect(result.contributoFisso).toBe(0);
    expect(result.contributoEccedenza).toBe(0);
  });

  it("should handle zero fatturato", () => {
    const result = calcolaInps({
      fatturato: 0,
      codiceAteco: "62.01",
      gestione: "separata",
    });

    expect(result.baseImponibile).toBe(0);
    expect(result.totaleDovuto).toBe(0);
  });
});

describe("calcolaInps - Artigiani", () => {
  it("should calculate fixed contribution with 35% discount when income below minimale", () => {
    const result = calcolaInps({
      fatturato: 20_000,
      codiceAteco: "43.21", // Construction → 86%
      gestione: "artigiani",
    });

    // Base imponibile = 20000 × 86% = 17200 (below minimale of 18415)
    expect(result.baseImponibile).toBe(17_200);

    // Fixed contribution with 35% discount: 4427.04 × 0.65 = 2877.58
    expect(result.contributoFisso).toBe(2_877.58);
    expect(result.contributoEccedenza).toBe(0);
    expect(result.totaleDovuto).toBe(2_877.58);
  });

  it("should calculate variable contribution when income exceeds minimale", () => {
    const result = calcolaInps({
      fatturato: 40_000,
      codiceAteco: "43.21", // Construction → 86%
      gestione: "artigiani",
    });

    // Base imponibile = 40000 × 86% = 34400
    expect(result.baseImponibile).toBe(34_400);

    // Fixed part: 4427.04 × 0.65 = 2877.58
    expect(result.contributoFisso).toBe(2_877.58);

    // Eccedenza: (34400 - 18415) × 24% × 0.65 = 15985 × 0.156 = 2493.66
    expect(result.contributoEccedenza).toBe(2_493.66);

    // Total = 2877.58 + 2493.66 = 5371.24
    expect(result.totaleDovuto).toBe(5_371.24);
  });
});

describe("calcolaInps - Commercianti", () => {
  it("should use commercianti rates", () => {
    const result = calcolaInps({
      fatturato: 20_000,
      codiceAteco: "47.11", // Commerce → 40%
      gestione: "commercianti",
    });

    // Base imponibile = 20000 × 40% = 8000 (below minimale)
    expect(result.baseImponibile).toBe(8_000);

    // Fixed contribution with 35% discount: 4515.43 × 0.65 = 2935.03
    expect(result.contributoFisso).toBe(2_935.03);
    expect(result.contributoEccedenza).toBe(0);
    expect(result.totaleDovuto).toBe(2_935.03);
  });
});

describe("calcolaInps - errors", () => {
  it("should throw for unknown ATECO code", () => {
    expect(() =>
      calcolaInps({
        fatturato: 30_000,
        codiceAteco: "00.00",
        gestione: "separata",
      })
    ).toThrow("Unknown ATECO code");
  });
});
