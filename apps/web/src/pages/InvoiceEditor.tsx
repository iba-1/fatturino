import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { InvoiceForm } from "@/components/InvoiceForm";
import { useClients } from "@/hooks/use-clients";
import { useInvoice, useCreateInvoice, useUpdateInvoice, type CreateInvoiceData } from "@/hooks/use-invoices";
import { parseApiFieldErrors } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeSlideUp } from "@/lib/motion";
import { ArrowLeft, Users } from "lucide-react";

export function InvoiceEditor() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id ?? "");
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  function handleSubmit(data: CreateInvoiceData) {
    setServerErrors({});
    if (isEdit) {
      updateInvoice.mutate(
        { id: id!, data },
        {
          onSuccess: () => navigate(`/invoices/${id}`),
          onError: (error) => setServerErrors(parseApiFieldErrors(error)),
        }
      );
    } else {
      createInvoice.mutate(data, {
        onSuccess: () => navigate("/invoices"),
        onError: (error) => setServerErrors(parseApiFieldErrors(error)),
      });
    }
  }

  if (clientsLoading || (isEdit && invoiceLoading)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="rounded-xl border p-6 space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-medium">{t("clients.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("clients.new")}</p>
        <Button className="mt-4" onClick={() => navigate("/clients")}>
          {t("clients.new")}
        </Button>
      </div>
    );
  }

  if (isEdit && invoice && invoice.stato !== "bozza") {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{t("common.error")}</p>
      </div>
    );
  }

  const title = isEdit ? t("invoices.edit") : t("invoices.new");

  const initialData = isEdit && invoice
    ? {
        clientId: invoice.clientId,
        tipoDocumento: invoice.tipoDocumento,
        dataEmissione: new Date(invoice.dataEmissione).toISOString().split("T")[0],
        causale: invoice.causale,
        lines: invoice.lines.map((l) => ({
          descrizione: l.descrizione,
          quantita: l.quantita,
          prezzoUnitario: l.prezzoUnitario,
        })),
      }
    : undefined;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/invoices/${id}` : "/invoices")} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

      <motion.div variants={fadeSlideUp} initial="initial" animate="animate">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              clients={clients}
              onSubmit={handleSubmit}
              onCancel={() => navigate(isEdit ? `/invoices/${id}` : "/invoices")}
              isLoading={isEdit ? updateInvoice.isPending : createInvoice.isPending}
              serverErrors={serverErrors}
              initialData={initialData}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
