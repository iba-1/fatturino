import { describe, it, expect } from "vitest";
import { calcolaAccontoSaldo, generaRigheErario } from "../tax/f24.js";

describe("calcolaAccontoSaldo", () => {
  it("should split tax into 40/60 acconti", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1_000,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(400);
    expect(result.secondoAcconto).toBe(600);
    expect(result.saldo).toBe(1_000);
  });

  it("should calculate saldo as difference between tax and acconti paid", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1_000,
      accontiVersati: 800,
      anno: 2024,
    });

    expect(result.saldo).toBe(200);
  });

  it("should not have negative saldo (overpaid)", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1_000,
      accontiVersati: 1_200,
      anno: 2024,
    });

    expect(result.saldo).toBe(0);
  });

  it("should handle zero tax", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 0,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
    expect(result.saldo).toBe(0);
  });

  it("should handle odd amounts with proper rounding", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1_425,
      accontiVersati: 0,
      anno: 2024,
    });

    expect(result.primoAcconto).toBe(570);   // 40%
    expect(result.secondoAcconto).toBe(855); // 60%
    expect(result.saldo).toBe(1_425);
  });
});

describe("generaRigheErario", () => {
  it("should generate 3 rows with correct codici tributo", () => {
    const rows = generaRigheErario(1_000, 2024);

    expect(rows).toHaveLength(3);

    expect(rows[0].codiceTributo).toBe("1790"); // Acconto primo
    expect(rows[0].importoADebito).toBe(400);  // 40%
    expect(rows[0].annoDiRiferimento).toBe(2024);

    expect(rows[1].codiceTributo).toBe("1791"); // Acconto secondo
    expect(rows[1].importoADebito).toBe(600);  // 60%

    expect(rows[2].codiceTributo).toBe("1792"); // Saldo
    expect(rows[2].importoADebito).toBe(1_000);
  });

  it("should set all crediti to 0", () => {
    const rows = generaRigheErario(1_000, 2024);
    for (const row of rows) {
      expect(row.importoACredito).toBe(0);
    }
  });
});
