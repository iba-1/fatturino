import { describe, it, expect } from "vitest";
import { buildCreditNoteValues } from "../routes/invoices.js";

describe("buildCreditNoteValues", () => {
  it("mirrors original invoice as TD04 with originalInvoiceId", () => {
    const original = {
      id: "orig-uuid",
      clientId: "client-1",
      anno: 2026,
      imponibile: "1000.00",
      impostaBollo: "2.00",
      totaleDocumento: "1002.00",
      causale: "Web development",
    };
    const originalLines = [
      {
        descrizione: "Sviluppo sito web",
        quantita: "1.0000",
        prezzoUnitario: "1000.00",
        prezzoTotale: "1000.00",
        aliquotaIva: "0.00",
        naturaIva: "N2.2",
      },
    ];

    const result = buildCreditNoteValues(original, originalLines, 5);

    expect(result.invoice.tipoDocumento).toBe("TD04");
    expect(result.invoice.clientId).toBe("client-1");
    expect(result.invoice.imponibile).toBe("1000.00");
    expect(result.invoice.impostaBollo).toBe("2.00");
    expect(result.invoice.totaleDocumento).toBe("1002.00");
    expect(result.invoice.originalInvoiceId).toBe("orig-uuid");
    expect(result.invoice.stato).toBe("bozza");
    expect(result.invoice.numeroFattura).toBe(5);
    expect(result.invoice.anno).toBe(2026);
    expect(result.invoice.causale).toBe("Web development");
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].descrizione).toBe("Sviluppo sito web");
    expect(result.lines[0].quantita).toBe("1.0000");
    expect(result.lines[0].naturaIva).toBe("N2.2");
  });

  it("defaults naturaIva to N2.2 when null", () => {
    const original = {
      id: "orig-uuid",
      clientId: "client-1",
      anno: 2026,
      imponibile: "500.00",
      impostaBollo: "0.00",
      totaleDocumento: "500.00",
      causale: null,
    };
    const originalLines = [
      {
        descrizione: "Consulenza",
        quantita: "1.0000",
        prezzoUnitario: "500.00",
        prezzoTotale: "500.00",
        aliquotaIva: "0.00",
        naturaIva: null,
      },
    ];

    const result = buildCreditNoteValues(original, originalLines, 2);

    expect(result.lines[0].naturaIva).toBe("N2.2");
    expect(result.invoice.causale).toBeNull();
  });

  it("mirrors multiple lines", () => {
    const original = {
      id: "orig-uuid",
      clientId: "client-1",
      anno: 2026,
      imponibile: "1500.00",
      impostaBollo: "2.00",
      totaleDocumento: "1502.00",
      causale: null,
    };
    const originalLines = [
      { descrizione: "Line 1", quantita: "1.0000", prezzoUnitario: "1000.00", prezzoTotale: "1000.00", aliquotaIva: "0.00", naturaIva: "N2.2" },
      { descrizione: "Line 2", quantita: "2.0000", prezzoUnitario: "250.00", prezzoTotale: "500.00", aliquotaIva: "0.00", naturaIva: "N2.2" },
    ];

    const result = buildCreditNoteValues(original, originalLines, 3);

    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].descrizione).toBe("Line 1");
    expect(result.lines[1].descrizione).toBe("Line 2");
    expect(result.lines[1].quantita).toBe("2.0000");
  });
});
