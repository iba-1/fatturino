import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from "../hooks/use-clients";
import { api } from "../lib/api";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockClients = [
  {
    id: "c1",
    userId: "u1",
    tipo: "persona_giuridica" as const,
    ragioneSociale: "Acme Srl",
    nome: null,
    cognome: null,
    partitaIva: "12345678901",
    codiceFiscale: "12345678901",
    codiceSdi: "0000000",
    pec: "acme@pec.it",
    indirizzo: "Via Roma 1",
    cap: "00100",
    citta: "Roma",
    provincia: "RM",
    nazione: "IT",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "c2",
    userId: "u1",
    tipo: "persona_fisica" as const,
    ragioneSociale: null,
    nome: "Mario",
    cognome: "Rossi",
    partitaIva: null,
    codiceFiscale: "RSSMRA80A01H501Z",
    codiceSdi: null,
    pec: null,
    indirizzo: "Via Milano 5",
    cap: "20100",
    citta: "Milano",
    provincia: "MI",
    nazione: "IT",
    createdAt: "2026-01-02",
    updatedAt: "2026-01-02",
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useClients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch clients list", async () => {
    vi.mocked(api.get).mockResolvedValue(mockClients);

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith("/clients");
    expect(result.current.data).toEqual(mockClients);
    expect(result.current.data).toHaveLength(2);
  });

  it("should return empty array when no clients", async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("should handle fetch error", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch a single client by id", async () => {
    vi.mocked(api.get).mockResolvedValue(mockClients[0]);

    const { result } = renderHook(() => useClient("c1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/clients/c1");
    expect(result.current.data?.ragioneSociale).toBe("Acme Srl");
  });

  it("should not fetch when id is empty", () => {
    renderHook(() => useClient(""), {
      wrapper: createWrapper(),
    });

    expect(api.get).not.toHaveBeenCalled();
  });
});

describe("useCreateClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a client and invalidate cache", async () => {
    const newClient = { ...mockClients[0], id: "c3" };
    vi.mocked(api.post).mockResolvedValue(newClient);

    const { result } = renderHook(() => useCreateClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      tipo: "persona_giuridica",
      ragioneSociale: "New Srl",
      codiceFiscale: "98765432109",
      indirizzo: "Via Nuova 1",
      cap: "00100",
      citta: "Roma",
      provincia: "RM",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith("/clients", expect.objectContaining({
      tipo: "persona_giuridica",
      ragioneSociale: "New Srl",
    }));
  });
});

describe("useUpdateClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a client", async () => {
    vi.mocked(api.put).mockResolvedValue({ ...mockClients[0], ragioneSociale: "Updated Srl" });

    const { result } = renderHook(() => useUpdateClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: "c1",
      data: {
        tipo: "persona_giuridica",
        ragioneSociale: "Updated Srl",
        codiceFiscale: "12345678901",
        indirizzo: "Via Roma 1",
        cap: "00100",
        citta: "Roma",
        provincia: "RM",
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.put).toHaveBeenCalledWith("/clients/c1", expect.objectContaining({
      ragioneSociale: "Updated Srl",
    }));
  });
});

describe("useDeleteClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a client", async () => {
    vi.mocked(api.delete).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteClient(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("c1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.delete).toHaveBeenCalledWith("/clients/c1");
  });
});
