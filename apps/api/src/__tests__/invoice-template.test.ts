import { describe, it, expect } from "vitest";
import { renderInvoiceHtml } from "../services/pdf/invoice-template.js";

const templateData = {
  cedente: {
    ragioneSociale: "Mario Rossi",
    partitaIva: "01234567890",
    codiceFiscale: "RSSMRA85M01H501Z",
    indirizzo: "Via Roma 1",
    cap: "00100",
    citta: "Roma",
    provincia: "RM",
  },
  cliente: {
    denominazione: "Acme S.r.l.",
    partitaIva: "09876543210",
    codiceFiscale: "09876543210",
    indirizzo: "Via Milano 10",
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
  },
  fattura: {
    numero: "1/2026",
    data: "02/03/2026",
    causale: "Consulenza informatica",
  },
  linee: [
    {
      descrizione: "Consulenza informatica",
      quantita: "1,00",
      prezzoUnitario: "1.000,00",
      prezzoTotale: "1.000,00",
    },
  ],
  imponibile: "1.000,00",
  bollo: "2,00",
  totale: "1.002,00",
  disclaimer: "Operazione effettuata ai sensi...",
};

describe("renderInvoiceHtml", () => {
  it("should produce valid HTML with all data", () => {
    const html = renderInvoiceHtml(templateData);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Mario Rossi");
    expect(html).toContain("01234567890");
    expect(html).toContain("Acme S.r.l.");
    expect(html).toContain("1/2026");
    expect(html).toContain("Consulenza informatica");
    expect(html).toContain("1.000,00");
    expect(html).toContain("2,00");
    expect(html).toContain("1.002,00");
  });

  it("should omit bollo row when bollo is not present", () => {
    const noBolloData = { ...templateData, bollo: undefined };
    const html = renderInvoiceHtml(noBolloData);

    expect(html).not.toContain("Imposta di bollo");
  });

  it("should omit causale when not present", () => {
    const noCausaleData = {
      ...templateData,
      fattura: { ...templateData.fattura, causale: undefined },
    };
    const html = renderInvoiceHtml(noCausaleData);
    expect(html).not.toContain("Causale:");
  });

  it("should omit cliente partitaIva when not present", () => {
    const noPivaData = {
      ...templateData,
      cliente: { ...templateData.cliente, partitaIva: undefined },
    };
    const html = renderInvoiceHtml(noPivaData);
    expect(html).not.toContain("P.IVA: 09876543210");
  });
});
