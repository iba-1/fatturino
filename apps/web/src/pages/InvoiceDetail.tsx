import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { useInvoice, useValidateInvoice, useSendInvoice, useDeleteInvoice, useMarkSent, useMarkPaid } from "@/hooks/use-invoices";
import { useClient } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, FileCheck, FileDown, FileText, AlertTriangle, Pencil, Send, Trash2, CheckCircle, CircleOff } from "lucide-react";
import { api } from "@/lib/api";

export function InvoiceDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, isError } = useInvoice(id ?? "");
  const { data: client } = useClient(invoice?.clientId ?? "");
  const { data: profile } = useProfile();
  const { data: validation, refetch: validate, isFetching: isValidating } = useValidateInvoice(id ?? "");
  const sendInvoice = useSendInvoice();
  const deleteInvoice = useDeleteInvoice();
  const markSentMutation = useMarkSent();
  const markPaidMutation = useMarkPaid();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showMarkSentConfirm, setShowMarkSentConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg bg-secondary animate-skeleton" />
        <div className="h-64 rounded-xl bg-secondary animate-skeleton" />
      </div>
    );
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

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    deleteInvoice.mutate(id!, {
      onSuccess: () => navigate("/invoices"),
    });
  };

  const handleMarkSent = () => {
    setShowMarkSentConfirm(false);
    markSentMutation.mutate(id!);
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Fattura {invoice.numeroFattura}/{invoice.anno}
        </h1>
        {invoice.pagata && (
          <Badge variant="success">{t("invoices.paid")}</Badge>
        )}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {invoice.stato === "bozza" && (
          <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)} data-testid="btn-edit-invoice">
            <Pencil className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
        )}
        {invoice.stato === "bozza" && (
          <Button
            variant="default"
            onClick={() => setShowSendConfirm(true)}
            disabled={!hasProfile || sendInvoice.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendInvoice.isPending ? t("common.loading") : t("invoices.send")}
          </Button>
        )}
        {invoice.stato === "bozza" && (
          <Button
            variant="outline"
            onClick={() => setShowMarkSentConfirm(true)}
            disabled={markSentMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {t("invoices.markSent")}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => markPaidMutation.mutate(id!)}
          disabled={markPaidMutation.isPending}
        >
          {invoice.pagata ? (
            <>
              <CircleOff className="h-4 w-4 mr-2" />
              {t("invoices.markUnpaid")}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("invoices.markPaid")}
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleValidate} disabled={isValidating || !hasProfile} data-testid="btn-validate">
          <FileCheck className="h-4 w-4 mr-2" />
          {t("invoices.validate")}
        </Button>
        <Button variant="outline" onClick={handleDownloadXml} disabled={!hasProfile || (hasValidated && !isValid)} data-testid="btn-download-xml">
          <FileDown className="h-4 w-4 mr-2" />
          {t("invoices.downloadXml")}
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf} disabled={!hasProfile} data-testid="btn-download-pdf">
          <FileText className="h-4 w-4 mr-2" />
          {t("invoices.downloadPdf")}
        </Button>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteInvoice.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("common.delete")}
        </Button>
      </div>

      {/* Missing profile banner */}
      {!hasProfile && (
        <div data-testid="missing-profile-banner" className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("invoices.missingProfile")}{" "}
            <a href="/settings" className="underline font-medium">{t("invoices.goToSettings")}</a>
          </span>
        </div>
      )}

      {/* Validation errors */}
      {validation && !validation.valid && (
        <div className="mb-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
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
        <div className="mb-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <p className="text-sm text-red-800">{downloadError}</p>
        </div>
      )}

      <InvoicePreview invoice={invoice} client={client} />

      {/* Send via email confirmation */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.sendConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.sendConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSendConfirm(false);
                sendInvoice.mutate(id!);
              }}
            >
              {t("invoices.send")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as sent confirmation */}
      <AlertDialog open={showMarkSentConfirm} onOpenChange={setShowMarkSentConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.markSentConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.markSentConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkSent}>
              {t("invoices.markSent")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
