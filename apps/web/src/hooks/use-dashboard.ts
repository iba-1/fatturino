import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardSummary {
  anno: number;
  totalRevenue: number;
  invoicesSent: number;
  pendingInvoices: number;
  monthlyRevenue: Array<{ month: number; revenue: number }>;
  tax: {
    coefficienteRedditivita: number;
    redditoLordo: number;
    redditoImponibile: number;
    aliquota: number;
    isStartup: boolean;
    impostaDovuta: number;
  } | null;
  inps: {
    gestione: string;
    baseImponibile: number;
    contributoFisso: number;
    contributoEccedenza: number;
    totaleDovuto: number;
  } | null;
  f24: {
    primoAcconto: number;
    secondoAcconto: number;
    saldo: number;
  } | null;
  recentInvoices: Array<{
    id: string;
    numeroFattura: number;
    dataEmissione: string;
    totaleDocumento: number;
    stato: string;
    clientName: string;
  }>;
  profileIncomplete: boolean;
}

export function useDashboardSummary(anno: number) {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard", anno],
    queryFn: () => api.get<DashboardSummary>(`/dashboard/summary?anno=${anno}`),
  });
}
