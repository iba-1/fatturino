import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { useInvoice, useValidateInvoice } from "@/hooks/use-invoices";
import { useClient } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileCheck, FileDown, FileText, AlertTriangle, Pencil } from "lucide-react";
import { api } from "@/lib/api";

export function InvoiceDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, isError } = useInvoice(id ?? "");
  const { data: client } = useClient(invoice?.clientId ?? "");
  const { data: profile } = useProfile();
  const { data: validation, refetch: validate, isFetching: isValidating } = useValidateInvoice(id ?? "");
  const [downloadError, setDownloadError] = useState<string | null>(null);

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

  const handleValidate = () => {
    setDownloadError(null);
    validate();
  };

  const handleDownloadXml = async () => {
    try {
      setDownloadError(null);
      const filename = `IT${profile?.partitaIva}_${invoice.numeroFattura.toString().padStart(5, "0")}.xml`;
      await api.download(`/invoices/${id}/xml`, filename);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadError(null);
      await api.download(`/invoices/${id}/pdf`, `Fattura_${invoice.numeroFattura}_${invoice.anno}.pdf`);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const hasProfile = !!profile;
  const isValid = validation?.valid === true;
  const hasValidated = validation !== undefined;

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

      {/* Action bar */}
      <div className="flex gap-2 mb-4">
        {invoice.stato === "bozza" && (
          <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
        )}
        <Button variant="outline" onClick={handleValidate} disabled={isValidating || !hasProfile}>
          <FileCheck className="h-4 w-4 mr-2" />
          {t("invoices.validate")}
        </Button>
        <Button variant="outline" onClick={handleDownloadXml} disabled={!hasProfile || (hasValidated && !isValid)}>
          <FileDown className="h-4 w-4 mr-2" />
          {t("invoices.downloadXml")}
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf} disabled={!hasProfile}>
          <FileText className="h-4 w-4 mr-2" />
          {t("invoices.downloadPdf")}
        </Button>
      </div>

      {/* Missing profile banner */}
      {!hasProfile && (
        <div data-testid="missing-profile-banner" className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("invoices.missingProfile")}{" "}
            <a href="/settings" className="underline font-medium">{t("invoices.goToSettings")}</a>
          </span>
        </div>
      )}

      {/* Validation errors */}
      {validation && !validation.valid && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-semibold text-red-800 mb-2">{t("invoices.validationErrors")}</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validation.errors.map((err, i) => (
              <li key={i}>• {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation success */}
      {validation?.valid && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{t("invoices.validationSuccess")}</p>
        </div>
      )}

      {/* Download error */}
      {downloadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{downloadError}</p>
        </div>
      )}

      <InvoicePreview invoice={invoice} client={client} />
    </div>
  );
}
