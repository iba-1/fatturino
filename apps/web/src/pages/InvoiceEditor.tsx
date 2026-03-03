import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { InvoiceForm } from "@/components/InvoiceForm";
import { useClients } from "@/hooks/use-clients";
import { useInvoice, useCreateInvoice, useUpdateInvoice, type CreateInvoiceData } from "@/hooks/use-invoices";
import { parseApiFieldErrors } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function InvoiceEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("clients.title")} — {t("clients.new")}
        </p>
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
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/invoices/${id}` : "/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

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
    </div>
  );
}
