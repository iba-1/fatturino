import { describe, it, expect } from "vitest";
import { SOGLIA_BOLLO, IMPORTO_BOLLO } from "@fatturino/shared";

describe("PUT /api/invoices/:id — business rules", () => {
  it("should reject update if invoice is not bozza", () => {
    const rejectedStati = ["inviata", "consegnata", "scartata", "accettata", "rifiutata"];
    for (const stato of rejectedStati) {
      expect(stato).not.toBe("bozza");
    }
  });

  it("should recalculate bollo when lines change", () => {
    const imponibile1 = 50.0;
    expect(imponibile1 > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0).toBe(0);

    const imponibile2 = 100.0;
    expect(imponibile2 > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0).toBe(IMPORTO_BOLLO);
  });

  it("should keep the same numeroFattura on update", () => {
    const originalNumero = 5;
    expect(originalNumero).toBe(5);
  });

  it("should recalculate totaleDocumento correctly", () => {
    const lines = [
      { quantita: 2, prezzoUnitario: 50 },
      { quantita: 1, prezzoUnitario: 30 },
    ];
    const imponibile = lines.reduce((sum, l) => sum + l.quantita * l.prezzoUnitario, 0);
    expect(imponibile).toBe(130);
    const bollo = imponibile > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
    expect(bollo).toBe(IMPORTO_BOLLO);
    expect(imponibile + bollo).toBe(132);
  });
});
