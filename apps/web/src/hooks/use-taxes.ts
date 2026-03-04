import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import i18next from "i18next";

export interface TaxPaymentStatus {
  deadline: string;
  label: string;
  /** Combined imposta + INPS amount due */
  amountDue: number;
  /** Imposta sostitutiva portion */
  amountDueImposta: number;
  /** INPS contributi portion */
  amountDueInps: number;
  amountPaid: number | null;
  datePaid: string | null;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
}

export interface TaxOverview {
  anno: number;
  totalRevenue: number;
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
    aliquota: number;
    contributoFisso: number;
    contributoEccedenza: number;
    totaleDovuto: number;
  } | null;
  f24: {
    primoAcconto: number;
    secondoAcconto: number;
    saldo: number;
  } | null;
  payments: TaxPaymentStatus[] | null;
  profileIncomplete: boolean;
}

export function useTaxOverview(anno: number) {
  return useQuery<TaxOverview>({
    queryKey: ["taxes", anno],
    queryFn: () => api.get<TaxOverview>(`/taxes/overview?anno=${anno}`),
  });
}

interface RecordPaymentData {
  anno: number;
  deadline: string;
  amountPaid: number;
  datePaid: string;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentData) => api.post("/taxes/payments", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["taxes", variables.anno] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: i18next.t("toast.paymentRecorded"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("record_payment_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}
