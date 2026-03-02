import { describe, it, expect } from "vitest";
import { mapToFatturaInput } from "../services/fattura-mapper.js";

describe("mapToFatturaInput", () => {
  it("should map user profile to CedenteData", () => {
    const userProfile = {
      partitaIva: "01234567890",
      codiceFiscale: "RSSMRA85M01H501Z",
      ragioneSociale: "Mario Rossi",
      regimeFiscale: "RF19",
      indirizzo: "Via Roma 1",
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
    };

    const client = {
      tipo: "persona_giuridica" as const,
      partitaIva: "09876543210",
      codiceFiscale: "09876543210",
      ragioneSociale: "Acme S.r.l.",
      indirizzo: "Via Milano 10",
      cap: "20100",
      citta: "Milano",
      provincia: "MI",
      nazione: "IT",
      codiceSdi: "ABCDEFG",
      pec: null,
      nome: null,
      cognome: null,
    };

    const invoice = {
      tipoDocumento: "TD01",
      dataEmissione: new Date("2026-03-02T00:00:00Z"),
      numeroFattura: 1,
      causale: "Consulenza",
      imponibile: "1000.00",
      impostaBollo: "2.00",
    };

    const lines = [
      {
        descrizione: "Consulenza informatica",
        quantita: "1.0000",
        prezzoUnitario: "1000.00",
        prezzoTotale: "1000.00",
        aliquotaIva: "0.00",
        naturaIva: "N2.2",
      },
    ];

    const result = mapToFatturaInput(userProfile, client, invoice, lines);

    expect(result.cedente.partitaIva).toBe("01234567890");
    expect(result.cedente.regimeFiscale).toBe("RF19");
    expect(result.cedente.nazione).toBe("IT");
    expect(result.cessionario.tipo).toBe("persona_giuridica");
    expect(result.cessionario.ragioneSociale).toBe("Acme S.r.l.");
    expect(result.cessionario.codiceSdi).toBe("ABCDEFG");
    expect(result.cessionario.pec).toBeUndefined();
    expect(result.datiGenerali.tipoDocumento).toBe("TD01");
    expect(result.datiGenerali.data).toBe("2026-03-02");
    expect(result.datiGenerali.importoBollo).toBe(2.0);
    expect(result.datiGenerali.divisa).toBe("EUR");
    expect(result.linee[0].prezzoTotale).toBe(1000.0);
    expect(result.linee[0].natura).toBe("N2.2");
    expect(result.linee[0].numeroLinea).toBe(1);
  });

  it("should map persona_fisica client correctly", () => {
    const userProfile = {
      partitaIva: "01234567890",
      codiceFiscale: "RSSMRA85M01H501Z",
      ragioneSociale: "Mario Rossi",
      regimeFiscale: "RF19",
      indirizzo: "Via Roma 1",
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
    };

    const client = {
      tipo: "persona_fisica" as const,
      partitaIva: null,
      codiceFiscale: "BNCLRA90A41F205X",
      ragioneSociale: null,
      nome: "Laura",
      cognome: "Bianchi",
      indirizzo: "Via Napoli 5",
      cap: "80100",
      citta: "Napoli",
      provincia: "NA",
      nazione: "IT",
      codiceSdi: null,
      pec: "laura@pec.it",
    };

    const invoice = {
      tipoDocumento: "TD01",
      dataEmissione: new Date("2026-03-02T00:00:00Z"),
      numeroFattura: 1,
      causale: null,
      imponibile: "50.00",
      impostaBollo: "0.00",
    };

    const lines = [
      {
        descrizione: "Consulenza",
        quantita: "1.0000",
        prezzoUnitario: "50.00",
        prezzoTotale: "50.00",
        aliquotaIva: "0.00",
        naturaIva: "N2.2",
      },
    ];

    const result = mapToFatturaInput(userProfile, client, invoice, lines);

    expect(result.cessionario.tipo).toBe("persona_fisica");
    expect(result.cessionario.nome).toBe("Laura");
    expect(result.cessionario.cognome).toBe("Bianchi");
    expect(result.cessionario.partitaIva).toBeUndefined();
    expect(result.cessionario.ragioneSociale).toBeUndefined();
    expect(result.cessionario.pec).toBe("laura@pec.it");
    expect(result.datiGenerali.causale).toBeUndefined();
    expect(result.datiGenerali.importoBollo).toBeUndefined();
  });
});
