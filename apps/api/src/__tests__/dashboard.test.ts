import { describe, it, expect } from "vitest";
import { aggregateDashboardData } from "../routes/dashboard.js";

describe("aggregateDashboardData", () => {
  it("returns zero values when no invoices exist", () => {
    const result = aggregateDashboardData({
      invoices: [],
      profile: null,
      anno: 2026,
    });

    expect(result.totalRevenue).toBe(0);
    expect(result.invoicesSent).toBe(0);
    expect(result.pendingInvoices).toBe(0);
    expect(result.monthlyRevenue).toHaveLength(12);
    expect(result.monthlyRevenue.every((m) => m.revenue === 0)).toBe(true);
    expect(result.tax).toBeNull();
    expect(result.inps).toBeNull();
    expect(result.f24).toBeNull();
    expect(result.profileIncomplete).toBe(true);
  });

  it("aggregates revenue from non-draft invoices only", () => {
    const invoices = [
      {
        totaleDocumento: "1000.00",
        stato: "inviata",
        dataEmissione: new Date("2026-03-15"),
      },
      {
        totaleDocumento: "500.00",
        stato: "bozza",
        dataEmissione: new Date("2026-03-20"),
      },
      {
        totaleDocumento: "2000.00",
        stato: "consegnata",
        dataEmissione: new Date("2026-06-01"),
      },
    ];

    const result = aggregateDashboardData({
      invoices,
      profile: null,
      anno: 2026,
    });

    expect(result.totalRevenue).toBe(3000);
    expect(result.invoicesSent).toBe(2);
    expect(result.pendingInvoices).toBe(1);
  });

  it("groups revenue by month correctly", () => {
    const invoices = [
      {
        totaleDocumento: "1000.00",
        stato: "inviata",
        dataEmissione: new Date("2026-01-15"),
      },
      {
        totaleDocumento: "500.00",
        stato: "inviata",
        dataEmissione: new Date("2026-01-20"),
      },
      {
        totaleDocumento: "2000.00",
        stato: "consegnata",
        dataEmissione: new Date("2026-06-01"),
      },
    ];

    const result = aggregateDashboardData({
      invoices,
      profile: null,
      anno: 2026,
    });

    expect(result.monthlyRevenue[0]).toEqual({ month: 1, revenue: 1500 });
    expect(result.monthlyRevenue[5]).toEqual({ month: 6, revenue: 2000 });
    expect(result.monthlyRevenue[11]).toEqual({ month: 12, revenue: 0 });
  });

  it("calculates tax estimates when profile is complete", () => {
    const invoices = [
      {
        totaleDocumento: "50000.00",
        stato: "inviata",
        dataEmissione: new Date("2026-03-15"),
      },
    ];
    const profile = {
      codiceAteco: "62.01",
      annoInizioAttivita: 2024,
      gestioneInps: "separata" as const,
    };

    const result = aggregateDashboardData({ invoices, profile, anno: 2026 });

    expect(result.tax).not.toBeNull();
    expect(result.tax!.aliquota).toBe(5);
    expect(result.tax!.coefficienteRedditivita).toBe(67);
    expect(result.inps).not.toBeNull();
    expect(result.inps!.gestione).toBe("separata");
    expect(result.f24).not.toBeNull();
    expect(result.profileIncomplete).toBe(false);
  });

  it("subtracts credit note (TD04) totals from revenue", () => {
    const result = aggregateDashboardData({
      invoices: [
        { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-15"), tipoDocumento: "TD01" },
        { totaleDocumento: "500.00", stato: "inviata", dataEmissione: new Date("2026-02-15"), tipoDocumento: "TD01" },
        { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-20"), tipoDocumento: "TD04" },
      ],
      profile: null,
      anno: 2026,
    });

    expect(result.totalRevenue).toBe(500);
    expect(result.invoicesSent).toBe(2);
  });

  it("excludes stornata invoices from sent count", () => {
    const result = aggregateDashboardData({
      invoices: [
        { totaleDocumento: "1000.00", stato: "stornata", dataEmissione: new Date("2026-01-15"), tipoDocumento: "TD01" },
        { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-20"), tipoDocumento: "TD04" },
        { totaleDocumento: "500.00", stato: "inviata", dataEmissione: new Date("2026-02-15"), tipoDocumento: "TD01" },
      ],
      profile: null,
      anno: 2026,
    });

    expect(result.totalRevenue).toBe(500);
    expect(result.invoicesSent).toBe(1);
  });

  it("subtracts credit notes from monthly revenue", () => {
    const result = aggregateDashboardData({
      invoices: [
        { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-15"), tipoDocumento: "TD01" },
        { totaleDocumento: "400.00", stato: "inviata", dataEmissione: new Date("2026-01-20"), tipoDocumento: "TD04" },
      ],
      profile: null,
      anno: 2026,
    });

    expect(result.monthlyRevenue[0].revenue).toBe(600);
  });

  it("marks profile incomplete if codiceAteco missing", () => {
    const result = aggregateDashboardData({
      invoices: [],
      profile: {
        codiceAteco: "",
        annoInizioAttivita: 2024,
        gestioneInps: "separata",
      },
      anno: 2026,
    });

    expect(result.profileIncomplete).toBe(true);
    expect(result.tax).toBeNull();
  });
});
