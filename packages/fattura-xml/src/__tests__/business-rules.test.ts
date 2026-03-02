import { describe, it, expect } from "vitest";
import { validateBusinessRules } from "../validation/business-rules.js";
import type { FatturaInput } from "../types.js";

function makeValidInput(): FatturaInput {
  return {
    cedente: {
      partitaIva: "01234567890",
      codiceFiscale: "RSSMRA85M01H501Z",
      ragioneSociale: "Mario Rossi",
      regimeFiscale: "RF19",
      indirizzo: "Via Roma 1",
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
      nazione: "IT",
    },
    cessionario: {
      tipo: "persona_giuridica",
      partitaIva: "09876543210",
      codiceFiscale: "09876543210",
      ragioneSociale: "Acme S.r.l.",
      indirizzo: "Via Milano 10",
      cap: "20100",
      citta: "Milano",
      provincia: "MI",
      nazione: "IT",
      codiceSdi: "ABCDEFG",
    },
    datiGenerali: {
      tipoDocumento: "TD01",
      divisa: "EUR",
      data: "2026-03-02",
      numero: "1",
      causale: "Operazione effettuata ai sensi dell'art.1, commi da 54 a 89, della Legge n. 190/2014 e successive modificazioni. Si richiede la non applicazione della ritenuta alla fonte a titolo d'acconto ai sensi dell'art. 1 comma 67 della Legge numero 190/2014.",
      importoBollo: 2.0,
    },
    linee: [
      {
        numeroLinea: 1,
        descrizione: "Consulenza",
        quantita: 1,
        prezzoUnitario: 100.0,
        prezzoTotale: 100.0,
        aliquotaIva: 0,
        natura: "N2.2",
      },
    ],
  };
}

describe("validateBusinessRules", () => {
  it("should return empty array for valid forfettario input", () => {
    const errors = validateBusinessRules(makeValidInput());
    expect(errors).toEqual([]);
  });

  it("should error if regimeFiscale is not RF19", () => {
    const input = makeValidInput();
    input.cedente.regimeFiscale = "RF01";
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_REGIME_FISCALE" })
    );
  });

  it("should error if line has non-zero aliquotaIva for forfettario", () => {
    const input = makeValidInput();
    input.linee[0].aliquotaIva = 22;
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_ALIQUOTA_IVA" })
    );
  });

  it("should error if line natura is not N2.2 for forfettario", () => {
    const input = makeValidInput();
    input.linee[0].natura = "N1";
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_NATURA_IVA" })
    );
  });

  it("should error if bollo missing when imponibile > 77.47", () => {
    const input = makeValidInput();
    input.datiGenerali.importoBollo = undefined;
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_BOLLO" })
    );
  });

  it("should not error about bollo when imponibile <= 77.47", () => {
    const input = makeValidInput();
    input.linee[0].prezzoUnitario = 50;
    input.linee[0].prezzoTotale = 50;
    input.datiGenerali.importoBollo = undefined;
    const errors = validateBusinessRules(input);
    expect(errors.find((e) => e.code === "MISSING_BOLLO")).toBeUndefined();
  });

  it("should error if tipoDocumento is not TD01 or TD04", () => {
    const input = makeValidInput();
    input.datiGenerali.tipoDocumento = "TD06";
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "UNSUPPORTED_TIPO_DOCUMENTO" })
    );
  });

  it("should error if partitaIva format is invalid", () => {
    const input = makeValidInput();
    input.cedente.partitaIva = "123";
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_PARTITA_IVA_CEDENTE" })
    );
  });

  it("should error if codiceSdi is not 7 characters", () => {
    const input = makeValidInput();
    input.cessionario.codiceSdi = "ABC";
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "INVALID_CODICE_SDI" })
    );
  });

  it("should error if no codiceSdi and no PEC", () => {
    const input = makeValidInput();
    input.cessionario.codiceSdi = undefined;
    input.cessionario.pec = undefined;
    const errors = validateBusinessRules(input);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_DESTINATARIO" })
    );
  });

  it("should accept codiceSdi 0000000 with PEC", () => {
    const input = makeValidInput();
    input.cessionario.codiceSdi = "0000000";
    input.cessionario.pec = "test@pec.it";
    const errors = validateBusinessRules(input);
    expect(errors.find((e) => e.code === "MISSING_DESTINATARIO")).toBeUndefined();
  });
});
