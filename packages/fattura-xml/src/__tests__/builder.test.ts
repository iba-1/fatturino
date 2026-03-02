import { describe, it, expect } from "vitest";
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
    causale: "Consulenza informatica marzo 2026",
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

describe("buildFatturaXml", () => {
  it("should produce valid XML string", () => {
    const xml = buildFatturaXml(validInput);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<p:FatturaElettronica");
    expect(xml).toContain("versione=\"FPR12\"");
    expect(xml).toContain("</p:FatturaElettronica>");
  });

  it("should contain FatturaElettronicaHeader", () => {
    const xml = buildFatturaXml(validInput);

    expect(xml).toContain("<FatturaElettronicaHeader>");
    expect(xml).toContain("<DatiTrasmissione>");
    expect(xml).toContain("<CedentePrestatore>");
    expect(xml).toContain("<CessionarioCommittente>");
  });

  it("should contain FatturaElettronicaBody", () => {
    const xml = buildFatturaXml(validInput);

    expect(xml).toContain("<FatturaElettronicaBody>");
    expect(xml).toContain("<DatiGenerali>");
    expect(xml).toContain("<DatiBeniServizi>");
    expect(xml).toContain("<DatiPagamento>");
  });

  it("should contain cedente P.IVA", () => {
    const xml = buildFatturaXml(validInput);
    expect(xml).toContain("<IdCodice>01234567890</IdCodice>");
  });

  it("should produce well-formed XML for TD04 (nota di credito)", () => {
    const td04Input = {
      ...validInput,
      datiGenerali: { ...validInput.datiGenerali, tipoDocumento: "TD04" },
    };
    const xml = buildFatturaXml(td04Input);

    expect(xml).toContain("<TipoDocumento>TD04</TipoDocumento>");
  });
});
