import { describe, it, expect } from "vitest";
import { buildBody } from "../sections/body.js";
import type { DatiGeneraliData, DettaglioLineaData } from "../types.js";

const datiGenerali: DatiGeneraliData = {
  tipoDocumento: "TD01",
  divisa: "EUR",
  data: "2026-03-02",
  numero: "1",
  causale: "Consulenza informatica",
  importoBollo: 2.0,
};

const linee: DettaglioLineaData[] = [
  {
    numeroLinea: 1,
    descrizione: "Consulenza informatica",
    quantita: 1,
    prezzoUnitario: 1000.0,
    prezzoTotale: 1000.0,
    aliquotaIva: 0,
    natura: "N2.2",
  },
  {
    numeroLinea: 2,
    descrizione: "Sviluppo software",
    quantita: 2,
    prezzoUnitario: 500.0,
    prezzoTotale: 1000.0,
    aliquotaIva: 0,
    natura: "N2.2",
  },
];

describe("buildBody", () => {
  it("should build DatiGeneraliDocumento", () => {
    const body = buildBody(datiGenerali, linee);
    const dg = body.DatiGenerali.DatiGeneraliDocumento;

    expect(dg.TipoDocumento).toBe("TD01");
    expect(dg.Divisa).toBe("EUR");
    expect(dg.Data).toBe("2026-03-02");
    expect(dg.Numero).toBe("1");
    expect(dg.Causale).toBe("Consulenza informatica");
  });

  it("should include DatiBollo when importoBollo is set", () => {
    const body = buildBody(datiGenerali, linee);
    const dg = body.DatiGenerali.DatiGeneraliDocumento;

    const bollo = dg.DatiBollo as { BolloVirtuale: string; ImportoBollo: string };
    expect(bollo.BolloVirtuale).toBe("SI");
    expect(bollo.ImportoBollo).toBe("2.00");
  });

  it("should omit DatiBollo when importoBollo is not set", () => {
    const noBolloDati = { ...datiGenerali, importoBollo: undefined };
    const body = buildBody(noBolloDati, linee);
    const dg = body.DatiGenerali.DatiGeneraliDocumento;

    expect(dg.DatiBollo).toBeUndefined();
  });

  it("should build DettaglioLinee array", () => {
    const body = buildBody(datiGenerali, linee);
    const dl = body.DatiBeniServizi.DettaglioLinee;

    expect(dl).toHaveLength(2);
    expect(dl[0].NumeroLinea).toBe(1);
    expect(dl[0].Descrizione).toBe("Consulenza informatica");
    expect(dl[0].Quantita).toBe("1.00");
    expect(dl[0].PrezzoUnitario).toBe("1000.00");
    expect(dl[0].PrezzoTotale).toBe("1000.00");
    expect(dl[0].AliquotaIVA).toBe("0.00");
    expect(dl[0].Natura).toBe("N2.2");
  });

  it("should build DatiRiepilogo for forfettario (0% IVA, N2.2)", () => {
    const body = buildBody(datiGenerali, linee);
    const dr = body.DatiBeniServizi.DatiRiepilogo;

    expect(dr).toHaveLength(1);
    expect(dr[0].AliquotaIVA).toBe("0.00");
    expect(dr[0].ImponibileImporto).toBe("2000.00");
    expect(dr[0].Imposta).toBe("0.00");
    expect(dr[0].Natura).toBe("N2.2");
    expect(dr[0].RiferimentoNormativo).toContain("art.1");
  });

  it("should build DatiPagamento with total", () => {
    const body = buildBody(datiGenerali, linee);
    const dp = body.DatiPagamento;

    expect(dp.CondizioniPagamento).toBe("TP02");
    expect(dp.DettaglioPagamento.ModalitaPagamento).toBe("MP05");
    // Total = imponibile (2000) + bollo (2) = 2002
    expect(dp.DettaglioPagamento.ImportoPagamento).toBe("2002.00");
  });
});
