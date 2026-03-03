import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import i18next from "i18next";

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  descrizione: string;
  quantita: string;
  prezzoUnitario: string;
  prezzoTotale: string;
  aliquotaIva: string;
  naturaIva: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  numeroFattura: number;
  anno: number;
  dataEmissione: string;
  tipoDocumento: string;
  causale: string | null;
  imponibile: string;
  impostaBollo: string;
  totaleDocumento: string;
  stato: string;
  pagata: boolean;
  dataPagamento: string | null;
  sdiIdentifier: string | null;
  sdiStatus: string | null;
  xmlContent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceWithLines extends Invoice {
  lines: InvoiceLine[];
}

export interface CreateInvoiceLineData {
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
  aliquotaIva?: number;
  naturaIva?: string;
}

export interface CreateInvoiceData {
  clientId: string;
  tipoDocumento?: string;
  causale?: string;
  dataEmissione: string;
  lines: CreateInvoiceLineData[];
}

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => api.get<Invoice[]>("/invoices"),
  });
}

export function useInvoice(id: string) {
  return useQuery<InvoiceWithLines>({
    queryKey: ["invoices", id],
    queryFn: () => api.get<InvoiceWithLines>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceData) =>
      api.post<InvoiceWithLines>("/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: i18next.t("toast.invoiceCreated"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("create_invoice_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: i18next.t("toast.invoiceDeleted"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("delete_invoice_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateInvoiceData }) =>
      api.put<InvoiceWithLines>(`/invoices/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      toast({ title: i18next.t("toast.invoiceUpdated"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("update_invoice_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<InvoiceWithLines>(`/invoices/${id}/send`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: i18next.t("toast.invoiceSent"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("send_invoice_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}

export function useMarkSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Invoice>(`/invoices/${id}/mark-sent`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: i18next.t("toast.invoiceMarkedSent"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("mark_sent_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}

export function useMarkPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Invoice>(`/invoices/${id}/mark-paid`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: i18next.t("toast.invoiceMarkedPaid"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("mark_paid_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function useValidateInvoice(id: string) {
  return useQuery<ValidationResult>({
    queryKey: ["invoices", id, "validate"],
    queryFn: () => api.get<ValidationResult>(`/invoices/${id}/xml/validate`),
    enabled: false, // only run on demand via refetch
  });
}
