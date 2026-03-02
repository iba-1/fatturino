import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

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
      toast({ title: "Invoice created", variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("create_invoice_failed", { error: error.message });
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Invoice deleted", variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("delete_invoice_failed", { error: error.message });
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
