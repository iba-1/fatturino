import { describe, it, expect } from "vitest";
import {
  SOGLIA_BOLLO,
  IMPORTO_BOLLO,
  NATURA_IVA_FORFETTARIO,
  DISCLAIMER_FORFETTARIO,
} from "@fatturino/shared";

/**
 * Tests for invoice calculation logic that will be used in the InvoiceForm component.
 * These test the pure calculation functions extracted from the form.
 */

interface LineItem {
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
  aliquotaIva: number;
  naturaIva: string;
}

function calculateLineTotal(line: LineItem): number {
  return Math.round(line.quantita * line.prezzoUnitario * 100) / 100;
}

function calculateSubtotal(lines: LineItem[]): number {
  return Math.round(
    lines.reduce((sum, line) => sum + calculateLineTotal(line), 0) * 100
  ) / 100;
}

function calculateBollo(subtotal: number): number {
  return subtotal > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
}

function calculateTotal(subtotal: number, bollo: number): number {
  return Math.round((subtotal + bollo) * 100) / 100;
}

describe("Invoice line calculations", () => {
  it("should calculate line total correctly", () => {
    expect(calculateLineTotal({ descrizione: "Test", quantita: 5, prezzoUnitario: 100, aliquotaIva: 0, naturaIva: "N2.2" })).toBe(500);
    expect(calculateLineTotal({ descrizione: "Test", quantita: 3, prezzoUnitario: 33.33, aliquotaIva: 0, naturaIva: "N2.2" })).toBe(99.99);
    expect(calculateLineTotal({ descrizione: "Test", quantita: 1, prezzoUnitario: 0.01, aliquotaIva: 0, naturaIva: "N2.2" })).toBe(0.01);
  });

  it("should handle fractional quantities", () => {
    expect(calculateLineTotal({ descrizione: "Hours", quantita: 7.5, prezzoUnitario: 80, aliquotaIva: 0, naturaIva: "N2.2" })).toBe(600);
  });
});

describe("Invoice subtotal calculations", () => {
  it("should sum multiple line totals", () => {
    const lines: LineItem[] = [
      { descrizione: "Service A", quantita: 1, prezzoUnitario: 500, aliquotaIva: 0, naturaIva: "N2.2" },
      { descrizione: "Service B", quantita: 2, prezzoUnitario: 250, aliquotaIva: 0, naturaIva: "N2.2" },
    ];
    expect(calculateSubtotal(lines)).toBe(1000);
  });

  it("should return 0 for empty lines", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("should handle single line", () => {
    const lines: LineItem[] = [
      { descrizione: "Solo", quantita: 1, prezzoUnitario: 77.47, aliquotaIva: 0, naturaIva: "N2.2" },
    ];
    expect(calculateSubtotal(lines)).toBe(77.47);
  });
});

describe("Bollo (stamp duty) logic", () => {
  it("should apply bollo when subtotal > €77.47", () => {
    expect(calculateBollo(77.48)).toBe(IMPORTO_BOLLO);
    expect(calculateBollo(100)).toBe(IMPORTO_BOLLO);
    expect(calculateBollo(1000)).toBe(IMPORTO_BOLLO);
  });

  it("should NOT apply bollo when subtotal <= €77.47", () => {
    expect(calculateBollo(77.47)).toBe(0);
    expect(calculateBollo(77.46)).toBe(0);
    expect(calculateBollo(50)).toBe(0);
    expect(calculateBollo(0)).toBe(0);
  });

  it("should apply exactly €2.00 bollo", () => {
    expect(calculateBollo(100)).toBe(2);
    expect(IMPORTO_BOLLO).toBe(2);
  });

  it("should use correct soglia threshold", () => {
    expect(SOGLIA_BOLLO).toBe(77.47);
  });
});

describe("Invoice total calculations", () => {
  it("should add bollo to subtotal", () => {
    expect(calculateTotal(100, 2)).toBe(102);
    expect(calculateTotal(1000, 2)).toBe(1002);
  });

  it("should return just subtotal when no bollo", () => {
    expect(calculateTotal(50, 0)).toBe(50);
  });
});

describe("Forfettario constants", () => {
  it("should default IVA natura to N2.2", () => {
    expect(NATURA_IVA_FORFETTARIO).toBe("N2.2");
  });

  it("should have the required forfettario disclaimer", () => {
    expect(DISCLAIMER_FORFETTARIO).toContain("art.1");
    expect(DISCLAIMER_FORFETTARIO).toContain("Legge n. 190/2014");
    expect(DISCLAIMER_FORFETTARIO).toContain("commi da 54 a 89");
  });
});
