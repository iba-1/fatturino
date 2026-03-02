import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Client {
  id: string;
  userId: string;
  tipo: "persona_fisica" | "persona_giuridica";
  ragioneSociale: string | null;
  nome: string | null;
  cognome: string | null;
  partitaIva: string | null;
  codiceFiscale: string;
  codiceSdi: string | null;
  pec: string | null;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  tipo: "persona_fisica" | "persona_giuridica";
  ragioneSociale?: string;
  nome?: string;
  cognome?: string;
  partitaIva?: string;
  codiceFiscale: string;
  codiceSdi?: string;
  pec?: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  nazione?: string;
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.get<Client[]>("/clients"),
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ["clients", id],
    queryFn: () => api.get<Client>(`/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientData) =>
      api.post<Client>("/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateClientData }) =>
      api.put<Client>(`/clients/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
