import { describe, it, expect } from "vitest";
import {
  ALIQUOTA_STARTUP,
  ALIQUOTA_ORDINARIA,
  SOGLIA_BOLLO,
  IMPORTO_BOLLO,
  ALIQUOTA_GESTIONE_SEPARATA,
  NATURA_IVA_FORFETTARIO,
  REGIME_FISCALE_FORFETTARIO,
  DISCLAIMER_FORFETTARIO,
  TIPO_DOCUMENTO,
  STATO_FATTURA,
} from "../constants/tax-rates.js";
import { CODICI_TRIBUTO_IMPOSTA, SCADENZE_FISCALI } from "../constants/codici-tributo.js";

describe("tax rate constants", () => {
  it("should have correct startup rate", () => {
    expect(ALIQUOTA_STARTUP).toBe(5);
  });

  it("should have correct ordinary rate", () => {
    expect(ALIQUOTA_ORDINARIA).toBe(15);
  });

  it("should have correct bollo threshold", () => {
    expect(SOGLIA_BOLLO).toBe(77.47);
  });

  it("should have correct bollo amount", () => {
    expect(IMPORTO_BOLLO).toBe(2.0);
  });

  it("should have correct gestione separata rate", () => {
    expect(ALIQUOTA_GESTIONE_SEPARATA).toBe(26.07);
  });

  it("should have correct natura IVA code", () => {
    expect(NATURA_IVA_FORFETTARIO).toBe("N2.2");
  });

  it("should have correct regime fiscale code", () => {
    expect(REGIME_FISCALE_FORFETTARIO).toBe("RF19");
  });

  it("should include the mandatory forfettario disclaimer", () => {
    expect(DISCLAIMER_FORFETTARIO).toContain("Legge n. 190/2014");
  });
});

describe("tipo documento constants", () => {
  it("should include standard invoice types", () => {
    expect(TIPO_DOCUMENTO.TD01).toBe("Fattura");
    expect(TIPO_DOCUMENTO.TD04).toBe("Nota di credito");
    expect(TIPO_DOCUMENTO.TD06).toBe("Parcella");
  });
});

describe("stato fattura constants", () => {
  it("should include all invoice states", () => {
    expect(STATO_FATTURA.BOZZA).toBe("bozza");
    expect(STATO_FATTURA.INVIATA).toBe("inviata");
    expect(STATO_FATTURA.CONSEGNATA).toBe("consegnata");
    expect(STATO_FATTURA.SCARTATA).toBe("scartata");
  });
});

describe("codici tributo", () => {
  it("should have correct imposta sostitutiva codes", () => {
    expect(CODICI_TRIBUTO_IMPOSTA.ACCONTO_PRIMO).toBe("1790");
    expect(CODICI_TRIBUTO_IMPOSTA.ACCONTO_SECONDO).toBe("1791");
    expect(CODICI_TRIBUTO_IMPOSTA.SALDO).toBe("1792");
  });
});

describe("tax deadlines", () => {
  it("should have correct deadline dates", () => {
    expect(SCADENZE_FISCALI.SALDO_E_PRIMO_ACCONTO).toEqual({ month: 6, day: 30 });
    expect(SCADENZE_FISCALI.SECONDO_ACCONTO).toEqual({ month: 11, day: 30 });
  });
});
