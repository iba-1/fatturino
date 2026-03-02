import { describe, it, expect } from "vitest";
import { buildHeader } from "../sections/header.js";
import type { CedenteData, CessionarioData } from "../types.js";

const cedente: CedenteData = {
  partitaIva: "01234567890",
  codiceFiscale: "RSSMRA85M01H501Z",
  ragioneSociale: "Mario Rossi",
  regimeFiscale: "RF19",
  indirizzo: "Via Roma 1",
  cap: "00100",
  citta: "Roma",
  provincia: "RM",
  nazione: "IT",
};

const cessionarioPG: CessionarioData = {
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
};

const cessionarioPF: CessionarioData = {
  tipo: "persona_fisica",
  codiceFiscale: "BNCLRA90A41F205X",
  nome: "Laura",
  cognome: "Bianchi",
  indirizzo: "Via Napoli 5",
  cap: "80100",
  citta: "Napoli",
  provincia: "NA",
  nazione: "IT",
  codiceSdi: "0000000",
  pec: "laura@pec.it",
};

describe("buildHeader", () => {
  it("should build DatiTrasmissione with codice SDI", () => {
    const header = buildHeader(cedente, cessionarioPG);
    const dt = header.DatiTrasmissione;

    expect(dt.IdTrasmittente.IdPaese).toBe("IT");
    expect(dt.IdTrasmittente.IdCodice).toBe("01234567890");
    expect(dt.FormatoTrasmissione).toBe("FPR12");
    expect(dt.CodiceDestinatario).toBe("ABCDEFG");
  });

  it("should set CodiceDestinatario to 0000000 and add PEC when no SDI code", () => {
    const header = buildHeader(cedente, cessionarioPF);
    const dt = header.DatiTrasmissione;

    expect(dt.CodiceDestinatario).toBe("0000000");
    expect(dt.PECDestinatario).toBe("laura@pec.it");
  });

  it("should build CedentePrestatore with correct data", () => {
    const header = buildHeader(cedente, cessionarioPG);
    const cp = header.CedentePrestatore;

    expect(cp.DatiAnagrafici.IdFiscaleIVA.IdPaese).toBe("IT");
    expect(cp.DatiAnagrafici.IdFiscaleIVA.IdCodice).toBe("01234567890");
    expect(cp.DatiAnagrafici.CodiceFiscale).toBe("RSSMRA85M01H501Z");
    expect(cp.DatiAnagrafici.Anagrafica.Denominazione).toBe("Mario Rossi");
    expect(cp.DatiAnagrafici.RegimeFiscale).toBe("RF19");
    expect(cp.Sede.Indirizzo).toBe("Via Roma 1");
    expect(cp.Sede.CAP).toBe("00100");
    expect(cp.Sede.Comune).toBe("Roma");
    expect(cp.Sede.Provincia).toBe("RM");
    expect(cp.Sede.Nazione).toBe("IT");
  });

  it("should build CessionarioCommittente for persona_giuridica", () => {
    const header = buildHeader(cedente, cessionarioPG);
    const cc = header.CessionarioCommittente;

    expect(cc.DatiAnagrafici.IdFiscaleIVA?.IdCodice).toBe("09876543210");
    expect(cc.DatiAnagrafici.Anagrafica.Denominazione).toBe("Acme S.r.l.");
    expect(cc.DatiAnagrafici.Anagrafica.Nome).toBeUndefined();
  });

  it("should build CessionarioCommittente for persona_fisica", () => {
    const header = buildHeader(cedente, cessionarioPF);
    const cc = header.CessionarioCommittente;

    expect(cc.DatiAnagrafici.IdFiscaleIVA).toBeUndefined();
    expect(cc.DatiAnagrafici.CodiceFiscale).toBe("BNCLRA90A41F205X");
    expect(cc.DatiAnagrafici.Anagrafica.Nome).toBe("Laura");
    expect(cc.DatiAnagrafici.Anagrafica.Cognome).toBe("Bianchi");
    expect(cc.DatiAnagrafici.Anagrafica.Denominazione).toBeUndefined();
  });
});
