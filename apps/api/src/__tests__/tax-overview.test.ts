import { describe, it, expect } from "vitest";
import { buildTaxOverview } from "../routes/taxes.js";

const completeProfile = {
  codiceAteco: "62.01",
  annoInizioAttivita: 2024,
  gestioneInps: "separata" as const,
};

// A fixed "now" before all deadlines of 2025 so statuses are predictable
const NOW_BEFORE_ALL = new Date("2025-01-01T00:00:00Z");
// A fixed "now" after primo_acconto deadline (June 30 2025) but before secondo_acconto
const NOW_AFTER_PRIMO = new Date("2025-07-01T00:00:00Z");
// A fixed "now" after all 2025 deadlines (saldo falls June 30 2026)
const NOW_AFTER_ALL = new Date("2026-07-01T00:00:00Z");

describe("buildTaxOverview", () => {
  it("returns profileIncomplete=true and null tax/inps/f24 when no profile", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [],
      profile: null,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    expect(result.profileIncomplete).toBe(true);
    expect(result.tax).toBeNull();
    expect(result.inps).toBeNull();
    expect(result.f24).toBeNull();
    expect(result.payments).toBeNull();
    expect(result.totalRevenue).toBe(0);
  });

  it("returns profileIncomplete=true when codiceAteco is empty", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [],
      profile: { codiceAteco: "", annoInizioAttivita: 2024, gestioneInps: "separata" },
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    expect(result.profileIncomplete).toBe(true);
    expect(result.tax).toBeNull();
  });

  it("excludes draft invoices from totalRevenue", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [
        { totaleDocumento: "1000.00", stato: "inviata" },
        { totaleDocumento: "500.00", stato: "bozza" },
        { totaleDocumento: "2000.00", stato: "consegnata" },
      ],
      profile: null,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    expect(result.totalRevenue).toBe(3000);
  });

  it("computes totalRevenue = 0 when all invoices are drafts", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [
        { totaleDocumento: "999.00", stato: "bozza" },
      ],
      profile: null,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    expect(result.totalRevenue).toBe(0);
  });

  it("calculates tax, inps, f24 when profile is complete", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "50000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    expect(result.profileIncomplete).toBe(false);
    expect(result.tax).not.toBeNull();
    expect(result.inps).not.toBeNull();
    expect(result.f24).not.toBeNull();
    expect(result.payments).toHaveLength(3);

    // Tax aliquota for startup (first 5 years) with codice 62.01 is 5%
    expect(result.tax!.aliquota).toBe(5);
    expect(result.inps!.gestione).toBe("separata");
  });

  it("builds 3 payment statuses: primo_acconto, secondo_acconto, saldo", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    const deadlines = result.payments!.map((p) => p.deadline);
    expect(deadlines).toEqual(["primo_acconto", "secondo_acconto", "saldo"]);
  });

  it("marks all payments as pending when now is before all deadlines", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    for (const p of result.payments!) {
      expect(p.status).toBe("pending");
      expect(p.amountPaid).toBe(0);
    }
  });

  it("marks primo_acconto as overdue when now is past its deadline and not paid", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_AFTER_PRIMO,
    });

    const primoAcconto = result.payments!.find((p) => p.deadline === "primo_acconto");
    expect(primoAcconto!.status).toBe("overdue");

    // secondo_acconto and saldo are still pending
    const secondoAcconto = result.payments!.find((p) => p.deadline === "secondo_acconto");
    expect(secondoAcconto!.status).toBe("pending");
  });

  it("marks all as overdue when now is after all deadlines and none paid", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_AFTER_ALL,
    });

    for (const p of result.payments!) {
      expect(p.status).toBe("overdue");
    }
  });

  it("marks a deadline as paid when amountPaid > 0", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [
        {
          deadline: "primo_acconto",
          amountDue: "500.00",
          amountPaid: "500.00",
          datePaid: "2025-06-15",
        },
      ],
      now: NOW_AFTER_PRIMO,
    });

    const primoAcconto = result.payments!.find((p) => p.deadline === "primo_acconto");
    expect(primoAcconto!.status).toBe("paid");
    expect(primoAcconto!.amountPaid).toBe(500);
    expect(primoAcconto!.datePaid).toBe("2025-06-15");
  });

  it("uses accontiVersati from actual payments (not saldo) for f24 saldo calculation", () => {
    // With no payments, saldo = impostaDovuta
    const noPayments = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    // With primo_acconto paid, saldo should be reduced
    const withPayment = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [
        {
          deadline: "primo_acconto",
          amountDue: "500.00",
          amountPaid: "500.00",
          datePaid: "2025-06-15",
        },
      ],
      now: NOW_BEFORE_ALL,
    });

    const saldoNoPayment = noPayments.f24!.saldo;
    const saldoWithPayment = withPayment.f24!.saldo;

    // Paying acconto reduces the saldo
    expect(saldoWithPayment).toBeLessThan(saldoNoPayment);
    expect(saldoWithPayment).toBe(Math.max(0, saldoNoPayment - 500));
  });

  it("handles numeric strings correctly (DB returns strings)", () => {
    const result = buildTaxOverview({
      anno: 2025,
      // totaleDocumento comes back as a string from the DB
      yearInvoices: [
        { totaleDocumento: "10000.50" as unknown as string, stato: "inviata" },
        { totaleDocumento: "5000.25" as unknown as string, stato: "inviata" },
      ],
      profile: null,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    expect(result.totalRevenue).toBe(15000.75);
  });

  it("returns correct anno in result", () => {
    const result = buildTaxOverview({
      anno: 2023,
      yearInvoices: [],
      profile: null,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    expect(result.anno).toBe(2023);
  });

  it("saldo due date is June 30 of the following year", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    const saldo = result.payments!.find((p) => p.deadline === "saldo");
    expect(saldo!.dueDate).toBe("2026-06-30");
  });

  it("primo_acconto due date is June 30 of the fiscal year", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    const primo = result.payments!.find((p) => p.deadline === "primo_acconto");
    expect(primo!.dueDate).toBe("2025-06-30");
  });

  it("secondo_acconto due date is November 30 of the fiscal year", () => {
    const result = buildTaxOverview({
      anno: 2025,
      yearInvoices: [{ totaleDocumento: "30000.00", stato: "inviata" }],
      profile: completeProfile,
      payments: [],
      now: NOW_BEFORE_ALL,
    });

    const secondo = result.payments!.find((p) => p.deadline === "secondo_acconto");
    expect(secondo!.dueDate).toBe("2025-11-30");
  });
});
