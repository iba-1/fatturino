import { describe, it, expect } from "vitest";
import { validateXml } from "../validation/xml-validator.js";
import { buildFatturaXml } from "../builder.js";
import type { FatturaInput } from "../types.js";

const validInput: FatturaInput = {
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
    causale: "Consulenza",
    importoBollo: 2.0,
  },
  linee: [
    {
      numeroLinea: 1,
      descrizione: "Consulenza informatica",
      quantita: 1,
      prezzoUnitario: 1000.0,
      prezzoTotale: 1000.0,
      aliquotaIva: 0,
      natura: "N2.2",
    },
  ],
};

describe("validateXml", () => {
  it("should return empty errors for valid XML from builder", () => {
    const xml = buildFatturaXml(validInput);
    const errors = validateXml(xml);
    expect(errors).toEqual([]);
  });

  it("should return errors for malformed XML", () => {
    const errors = validateXml("<not>valid<xml");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("XML_PARSE_ERROR");
  });

  it("should return errors for XML missing root element", () => {
    const errors = validateXml('<?xml version="1.0"?><wrong>content</wrong>');
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_ROOT_ELEMENT" })
    );
  });

  it("should return errors for XML missing header", () => {
    const xml = '<?xml version="1.0"?><p:FatturaElettronica xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" versione="FPR12"><FatturaElettronicaBody></FatturaElettronicaBody></p:FatturaElettronica>';
    const errors = validateXml(xml);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_HEADER" })
    );
  });

  it("should return errors for XML missing body", () => {
    const xml = '<?xml version="1.0"?><p:FatturaElettronica xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" versione="FPR12"><FatturaElettronicaHeader><DatiTrasmissione></DatiTrasmissione></FatturaElettronicaHeader></p:FatturaElettronica>';
    const errors = validateXml(xml);
    expect(errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_BODY" })
    );
  });
});
