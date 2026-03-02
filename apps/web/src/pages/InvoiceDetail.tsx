import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicePreview } from "@/components/InvoicePreview";
import { useInvoice } from "@/hooks/use-invoices";
import { useClient } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function InvoiceDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, isError } = useInvoice(id ?? "");
  const { data: client } = useClient(invoice?.clientId ?? "");

  if (isLoading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  if (isError || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Fattura {invoice.numeroFattura}/{invoice.anno}
        </h1>
      </div>

      <InvoicePreview invoice={invoice} client={client} />
    </div>
  );
}
