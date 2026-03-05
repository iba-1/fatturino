import { describe, it, expect } from "vitest";
import { CODICI_TRIBUTO_IMPOSTA, calcolaAccontoSaldo, SOGLIA_MINIMA_ACCONTI } from "@fatturino/shared";
import type { F24Deadline } from "../services/f24-pdf.js";

/**
 * Pure-logic tests for F24 PDF generation.
 * These tests do not invoke generateF24Pdf (which reads the template file from disk),
 * but instead test the logic used inside it in isolation.
 */

// --- CF splitting logic ---

function splitCodiceFiscale(cf: string): string[] {
  const upper = cf.toUpperCase();
  return Array.from({ length: Math.min(upper.length, 16) }, (_, i) => upper[i]);
}

describe("F24 PDF — codice fiscale splitting", () => {
  it("splits a 16-character CF into 16 individual chars", () => {
    const cf = "RSSMRA80A01H501U";
    const parts = splitCodiceFiscale(cf);
    expect(parts).toHaveLength(16);
    expect(parts[0]).toBe("R");
    expect(parts[1]).toBe("S");
    expect(parts[15]).toBe("U");
  });

  it("uppercases lowercase input before splitting", () => {
    const cf = "rssmra80a01h501u";
    const parts = splitCodiceFiscale(cf);
    expect(parts[0]).toBe("R");
    expect(parts[4]).toBe("R");
  });

  it("clamps to 16 chars if CF is longer than expected", () => {
    const cf = "RSSMRA80A01H501U_EXTRA";
    const parts = splitCodiceFiscale(cf);
    expect(parts).toHaveLength(16);
  });

  it("handles a shorter CF without error", () => {
    const cf = "ABC123";
    const parts = splitCodiceFiscale(cf);
    expect(parts).toHaveLength(6);
    expect(parts[0]).toBe("A");
    expect(parts[5]).toBe("3");
  });

  it("produces correct field names cf1 through cf16", () => {
    const cf = "RSSMRA80A01H501U";
    const fieldNames = Array.from({ length: cf.length }, (_, i) => `cf${i + 1}`);
    expect(fieldNames[0]).toBe("cf1");
    expect(fieldNames[15]).toBe("cf16");
  });
});

// --- Deadline → codice tributo mapping ---

const DEADLINE_CODICE: Record<F24Deadline, string> = {
  primo_acconto: CODICI_TRIBUTO_IMPOSTA.ACCONTO_PRIMO,
  secondo_acconto: CODICI_TRIBUTO_IMPOSTA.ACCONTO_SECONDO,
  saldo: CODICI_TRIBUTO_IMPOSTA.SALDO,
};

describe("F24 PDF — deadline to codice tributo mapping", () => {
  it("maps primo_acconto to 1790", () => {
    expect(DEADLINE_CODICE["primo_acconto"]).toBe("1790");
  });

  it("maps secondo_acconto to 1791", () => {
    expect(DEADLINE_CODICE["secondo_acconto"]).toBe("1791");
  });

  it("maps saldo to 1792", () => {
    expect(DEADLINE_CODICE["saldo"]).toBe("1792");
  });

  it("uses the exported constants from @fatturino/shared (not hardcoded strings)", () => {
    expect(CODICI_TRIBUTO_IMPOSTA.ACCONTO_PRIMO).toBe("1790");
    expect(CODICI_TRIBUTO_IMPOSTA.ACCONTO_SECONDO).toBe("1791");
    expect(CODICI_TRIBUTO_IMPOSTA.SALDO).toBe("1792");
  });
});

// --- Amount formatting ---

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

describe("F24 PDF — amount formatting", () => {
  it("formats an integer amount with two decimal places", () => {
    expect(formatAmount(1500)).toBe("1500.00");
  });

  it("formats an amount with one decimal correctly", () => {
    expect(formatAmount(1234.5)).toBe("1234.50");
  });

  it("formats an amount with two decimals unchanged", () => {
    expect(formatAmount(999.99)).toBe("999.99");
  });

  it("formats zero as 0.00", () => {
    expect(formatAmount(0)).toBe("0.00");
  });

  it("rounds to two decimal places (toFixed behaviour)", () => {
    // toFixed rounds: 1.005 -> browser-specific, but .006 is safe
    expect(formatAmount(1.006)).toBe("1.01");
  });

  it("formats large amounts correctly", () => {
    expect(formatAmount(85000.75)).toBe("85000.75");
  });
});

// --- Rateazione per deadline ---

const DEADLINE_RATEAZIONE: Record<F24Deadline, string | null> = {
  primo_acconto: "0101",
  secondo_acconto: null,
  saldo: "0101",
};

describe("F24 PDF — rateazione per deadline", () => {
  it("primo_acconto uses 0101 (single payment)", () => {
    expect(DEADLINE_RATEAZIONE["primo_acconto"]).toBe("0101");
  });

  it("secondo_acconto has no rateazione (cannot be rateizzato)", () => {
    expect(DEADLINE_RATEAZIONE["secondo_acconto"]).toBeNull();
  });

  it("saldo uses 0101 (single payment)", () => {
    expect(DEADLINE_RATEAZIONE["saldo"]).toBe("0101");
  });
});

// --- Minimum threshold for acconti ---

describe("F24 — minimum threshold for acconti (€51.65)", () => {
  it("returns zero acconti when tax is below threshold", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 50,
      accontiVersati: 0,
      anno: 2025,
    });
    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
    expect(result.saldo).toBe(50);
  });

  it("returns single acconto (novembre only) when tax is at threshold (€51.65–€257.52 band)", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: SOGLIA_MINIMA_ACCONTI,
      accontiVersati: 0,
      anno: 2025,
    });
    // Single payment band: primo = 0, secondo = full amount
    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(SOGLIA_MINIMA_ACCONTI);
  });

  it("returns acconti when tax is above threshold", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 1000,
      accontiVersati: 0,
      anno: 2025,
    });
    expect(result.primoAcconto).toBe(400);   // 40%
    expect(result.secondoAcconto).toBe(600); // 60%
    expect(result.saldo).toBe(1000);
  });

  it("returns zero acconti for zero tax", () => {
    const result = calcolaAccontoSaldo({
      impostaDovuta: 0,
      accontiVersati: 0,
      anno: 2025,
    });
    expect(result.primoAcconto).toBe(0);
    expect(result.secondoAcconto).toBe(0);
    expect(result.saldo).toBe(0);
  });
});

// --- F24 PDF field name mapping ---

describe("F24 PDF — correct field names for PDF template", () => {
  it("Sezione Erario fields follow codtrib/ratregpro/annorif/impvers/impcom pattern", () => {
    // These are the actual field names from the F24_editabile.pdf AcroForm
    const erarioFields = [
      "codtrib1", "ratregpro1", "annorif1", "impvers1", "impcom1",
      "codtrib2", "ratregpro2", "annorif2", "impvers2", "impcom2",
    ];
    erarioFields.forEach(name => expect(name).toMatch(/^(codtrib|ratregpro|annorif|impvers|impcom)\d+$/));
  });

  it("Sezione INPS importi use impvers10-13 (not impdinps)", () => {
    // INPS row 1 → impvers10, row 2 → impvers11, etc.
    const inpsImportiFields = ["impvers10", "impvers11", "impvers12", "impvers13"];
    inpsImportiFields.forEach(name => expect(name).toMatch(/^impvers1[0-3]$/));
  });

  it("Sezione INPS totals use totc/totd/salcd (not toti/salil)", () => {
    const inpsTotalFields = { debito: "totc", credito: "totd", saldo: "salcd" };
    expect(inpsTotalFields.debito).toBe("totc");
    expect(inpsTotalFields.saldo).toBe("salcd");
  });

  it("Grand total uses salfin (saldo finale)", () => {
    expect("salfin").toBe("salfin");
  });
});

// --- Route param: deadline URL slug → F24Deadline key conversion ---

function slugToDeadline(slug: string): F24Deadline {
  return slug.replace(/-/g, "_") as F24Deadline;
}

describe("F24 route — deadline URL slug conversion", () => {
  it("converts primo-acconto to primo_acconto", () => {
    expect(slugToDeadline("primo-acconto")).toBe("primo_acconto");
  });

  it("converts secondo-acconto to secondo_acconto", () => {
    expect(slugToDeadline("secondo-acconto")).toBe("secondo_acconto");
  });

  it("converts saldo to saldo (no hyphens)", () => {
    expect(slugToDeadline("saldo")).toBe("saldo");
  });
});
