import { describe, it, expect } from "vitest";
import type {
  CedenteData,
  CessionarioData,
  DatiGeneraliData,
  DettaglioLineaData,
  FatturaInput,
} from "../types.js";

describe("FatturaPA types", () => {
  it("should allow constructing a valid FatturaInput", () => {
    const input: FatturaInput = {
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
        causale: "Consulenza informatica",
        importoBollo: 2.0,
      },
      linee: [
        {
          numeroLinea: 1,
          descrizione: "Consulenza informatica marzo 2026",
          quantita: 1,
          prezzoUnitario: 1000.0,
          prezzoTotale: 1000.0,
          aliquotaIva: 0,
          natura: "N2.2",
        },
      ],
    };

    expect(input.cedente.partitaIva).toBe("01234567890");
    expect(input.linee).toHaveLength(1);
    expect(input.datiGenerali.tipoDocumento).toBe("TD01");
  });

  it("should allow persona_fisica cessionario without partitaIva", () => {
    const cessionario: CessionarioData = {
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

    expect(cessionario.partitaIva).toBeUndefined();
    expect(cessionario.nome).toBe("Laura");
  });
});
