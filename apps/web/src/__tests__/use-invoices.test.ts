import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useInvoices, useInvoice, useCreateInvoice, useDeleteInvoice } from "../hooks/use-invoices";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockInvoices = [
  {
    id: "inv1",
    userId: "u1",
    clientId: "c1",
    numeroFattura: 1,
    anno: 2026,
    dataEmissione: "2026-01-15",
    tipoDocumento: "TD01",
    causale: "Consulenza",
    imponibile: "1000.00",
    impostaBollo: "2.00",
    totaleDocumento: "1002.00",
    stato: "bozza",
    sdiIdentifier: null,
    sdiStatus: null,
    xmlContent: null,
    createdAt: "2026-01-15",
    updatedAt: "2026-01-15",
  },
  {
    id: "inv2",
    userId: "u1",
    clientId: "c2",
    numeroFattura: 2,
    anno: 2026,
    dataEmissione: "2026-02-01",
    tipoDocumento: "TD01",
    causale: null,
    imponibile: "50.00",
    impostaBollo: "0",
    totaleDocumento: "50.00",
    stato: "inviata",
    sdiIdentifier: "SDI123",
    sdiStatus: "consegnata",
    xmlContent: null,
    createdAt: "2026-02-01",
    updatedAt: "2026-02-01",
  },
];

const mockInvoiceWithLines = {
  ...mockInvoices[0],
  lines: [
    {
      id: "l1",
      invoiceId: "inv1",
      descrizione: "Consulenza tecnica",
      quantita: "10",
      prezzoUnitario: "100.00",
      prezzoTotale: "1000.00",
      aliquotaIva: "0",
      naturaIva: "N2.2",
      createdAt: "2026-01-15",
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch invoices list", async () => {
    vi.mocked(api.get).mockResolvedValue(mockInvoices);

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/invoices");
    expect(result.current.data).toHaveLength(2);
  });

  it("should return empty array when no invoices", async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch a single invoice with lines", async () => {
    vi.mocked(api.get).mockResolvedValue(mockInvoiceWithLines);

    const { result } = renderHook(() => useInvoice("inv1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/invoices/inv1");
    expect(result.current.data?.lines).toHaveLength(1);
    expect(result.current.data?.lines[0].descrizione).toBe("Consulenza tecnica");
  });

  it("should not fetch when id is empty", () => {
    renderHook(() => useInvoice(""), {
      wrapper: createWrapper(),
    });

    expect(api.get).not.toHaveBeenCalled();
  });
});

describe("useCreateInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create an invoice with line items", async () => {
    vi.mocked(api.post).mockResolvedValue(mockInvoiceWithLines);

    const { result } = renderHook(() => useCreateInvoice(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      clientId: "c1",
      dataEmissione: "2026-01-15",
      lines: [
        { descrizione: "Consulenza tecnica", quantita: 10, prezzoUnitario: 100 },
      ],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith("/invoices", expect.objectContaining({
      clientId: "c1",
      lines: expect.arrayContaining([
        expect.objectContaining({ descrizione: "Consulenza tecnica" }),
      ]),
    }));
  });
});

describe("useDeleteInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete an invoice", async () => {
    vi.mocked(api.delete).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteInvoice(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("inv1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.delete).toHaveBeenCalledWith("/invoices/inv1");
  });
});
