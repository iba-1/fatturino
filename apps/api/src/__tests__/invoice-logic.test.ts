import { describe, it, expect } from "vitest";
import { SOGLIA_BOLLO, IMPORTO_BOLLO } from "@fatturino/shared";

/**
 * Unit tests for invoice business logic that doesn't require DB.
 * Tests the calculation rules applied in the invoice routes.
 */

function calculateInvoiceTotals(
  lines: Array<{ quantita: number; prezzoUnitario: number }>
) {
  const imponibile = lines.reduce(
    (sum, line) => sum + line.quantita * line.prezzoUnitario,
    0
  );
  const imponibileRounded = Math.round(imponibile * 100) / 100;
  const impostaBollo = imponibileRounded > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
  const totaleDocumento = imponibileRounded + impostaBollo;

  return { imponibile: imponibileRounded, impostaBollo, totaleDocumento };
}

describe("invoice total calculation", () => {
  it("should calculate imponibile as sum of (quantita * prezzoUnitario)", () => {
    const result = calculateInvoiceTotals([
      { quantita: 2, prezzoUnitario: 50 },
      { quantita: 3, prezzoUnitario: 100 },
    ]);

    expect(result.imponibile).toBe(400); // 100 + 300
  });

  it("should apply bollo when imponibile > €77.47", () => {
    const result = calculateInvoiceTotals([
      { quantita: 1, prezzoUnitario: 100 },
    ]);

    expect(result.impostaBollo).toBe(2);
    expect(result.totaleDocumento).toBe(102);
  });

  it("should NOT apply bollo when imponibile <= €77.47", () => {
    const result = calculateInvoiceTotals([
      { quantita: 1, prezzoUnitario: 50 },
    ]);

    expect(result.impostaBollo).toBe(0);
    expect(result.totaleDocumento).toBe(50);
  });

  it("should NOT apply bollo at exactly €77.47", () => {
    const result = calculateInvoiceTotals([
      { quantita: 1, prezzoUnitario: 77.47 },
    ]);

    expect(result.impostaBollo).toBe(0);
    expect(result.totaleDocumento).toBe(77.47);
  });

  it("should apply bollo at €77.48", () => {
    const result = calculateInvoiceTotals([
      { quantita: 1, prezzoUnitario: 77.48 },
    ]);

    expect(result.impostaBollo).toBe(2);
    expect(result.totaleDocumento).toBe(79.48);
  });

  it("should handle fractional amounts correctly", () => {
    const result = calculateInvoiceTotals([
      { quantita: 3, prezzoUnitario: 33.33 },
    ]);

    // 3 × 33.33 = 99.99
    expect(result.imponibile).toBe(99.99);
    expect(result.impostaBollo).toBe(2);
    expect(result.totaleDocumento).toBe(101.99);
  });

  it("should handle empty lines", () => {
    const result = calculateInvoiceTotals([]);

    expect(result.imponibile).toBe(0);
    expect(result.impostaBollo).toBe(0);
    expect(result.totaleDocumento).toBe(0);
  });
});
