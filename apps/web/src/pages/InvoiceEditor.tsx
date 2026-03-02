import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { useClients } from "@/hooks/use-clients";
import { useCreateInvoice, type CreateInvoiceData } from "@/hooks/use-invoices";
import { parseApiFieldErrors } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function InvoiceEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const createInvoice = useCreateInvoice();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  function handleSubmit(data: CreateInvoiceData) {
    setServerErrors({});
    createInvoice.mutate(data, {
      onSuccess: () => {
        navigate("/invoices");
      },
      onError: (error) => {
        setServerErrors(parseApiFieldErrors(error));
      },
    });
  }

  if (clientsLoading) {
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

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t("invoices.new")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/invoices")}
            isLoading={createInvoice.isPending}
            serverErrors={serverErrors}
          />
        </CardContent>
      </Card>
    </div>
  );
}
