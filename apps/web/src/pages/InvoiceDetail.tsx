import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useState } from "react";
import { InvoicePreview } from "@/components/InvoicePreview";
import { useInvoice, useValidateInvoice, useSendInvoice, useDeleteInvoice, useMarkSent, useMarkPaid, useCreateCreditNote } from "@/hooks/use-invoices";
import { useClient } from "@/hooks/use-clients";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, FileCheck, FileDown, FileText, AlertTriangle, Pencil, Send, Trash2, CheckCircle, CircleOff } from "lucide-react";
import { motion } from "framer-motion";
import { fadeSlideUp } from "@/lib/motion";
import { api } from "@/lib/api";

export function InvoiceDetail() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading, isError } = useInvoice(id ?? "");
  const { data: client } = useClient(invoice?.clientId ?? "");
  const { data: profile } = useProfile();
  const { data: validation, refetch: validate, isFetching: isValidating } = useValidateInvoice(id ?? "");
  const sendInvoice = useSendInvoice();
  const deleteInvoice = useDeleteInvoice();
  const markSentMutation = useMarkSent();
  const markPaidMutation = useMarkPaid();
  const createCreditNote = useCreateCreditNote();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showMarkSentConfirm, setShowMarkSentConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
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
    deleteInvoice.mutate(id!, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        navigate("/invoices");
      },
    });
  };

  const handleMarkSent = () => {
    markSentMutation.mutate(id!, {
      onSuccess: () => setShowMarkSentConfirm(false),
    });
  };

  const hasProfile = !!profile;
  const isValid = validation?.valid === true;
  const hasValidated = validation !== undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Fattura {invoice.numeroFattura}/{invoice.anno}
        </h1>
        {invoice.pagata && (
          <Badge variant="success">{t("invoices.paid")}</Badge>
        )}
        {invoice.creditNoteId && (
          <Button variant="link" size="sm" onClick={() => navigate(`/invoices/${invoice.creditNoteId}`)}>
            {t("invoices.viewCreditNote")}
          </Button>
        )}
        {invoice.originalInvoiceId && (
          <Button variant="link" size="sm" onClick={() => navigate(`/invoices/${invoice.originalInvoiceId}`)}>
            {t("invoices.viewOriginalInvoice")}
          </Button>
        )}
      </div>

      {/* Action bar */}
      <motion.div variants={fadeSlideUp} initial="initial" animate="animate" className="flex flex-wrap gap-2 mb-4">
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
            disabled={!hasProfile}
            loading={sendInvoice.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {t("invoices.send")}
          </Button>
        )}
        {invoice.stato === "bozza" && (
          <Button
            variant="outline"
            onClick={() => setShowMarkSentConfirm(true)}
            loading={markSentMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {t("invoices.markSent")}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => markPaidMutation.mutate(id!)}
          loading={markPaidMutation.isPending}
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
        {invoice.stato !== "stornata" && !invoice.creditNoteId && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (invoice.stato === "bozza") {
                setShowDeleteConfirm(true);
              } else {
                setShowCreditNoteDialog(true);
              }
            }}
            loading={deleteInvoice.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </Button>
        )}
      </motion.div>

      {/* Missing profile banner */}
      {!hasProfile && (
        <div data-testid="missing-profile-banner" className="mb-4 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-foreground" />
          <span className="text-sm text-warning-foreground">
            {t("invoices.missingProfile")}{" "}
            <a href="/settings" className="underline font-medium">{t("invoices.goToSettings")}</a>
          </span>
        </div>
      )}

      {/* Validation errors */}
      {validation && !validation.valid && (
        <div role="alert" className="mb-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <h2 className="text-sm font-semibold text-destructive-foreground mb-2">{t("invoices.validationErrors")}</h2>
          <ul className="text-sm text-destructive-foreground space-y-1">
            {validation.errors.map((err, i) => (
              <li key={i}>• {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation success */}
      {validation?.valid && (
        <div role="status" className="mb-4 p-4 bg-success/10 border border-success/30 rounded-xl">
          <p className="text-sm text-success-foreground">{t("invoices.validationSuccess")}</p>
        </div>
      )}

      {/* Download error */}
      {downloadError && (
        <div role="alert" className="mb-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <p className="text-sm text-destructive-foreground">{downloadError}</p>
        </div>
      )}

      <motion.div variants={fadeSlideUp} initial="initial" animate="animate">
        <InvoicePreview invoice={invoice} client={client} />
      </motion.div>

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
            <Button
              loading={sendInvoice.isPending}
              onClick={() => {
                sendInvoice.mutate(id!, {
                  onSuccess: () => setShowSendConfirm(false),
                });
              }}
            >
              {t("invoices.send")}
            </Button>
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
            <Button onClick={handleMarkSent} loading={markSentMutation.isPending}>
              {t("invoices.markSent")}
            </Button>
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
            <Button
              onClick={handleDelete}
              loading={deleteInvoice.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credit note dialog for sent invoices */}
      <AlertDialog open={showCreditNoteDialog} onOpenChange={setShowCreditNoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.deleteAnywayTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.deleteAnywayDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <Button
              loading={createCreditNote.isPending}
              onClick={() => {
                createCreditNote.mutate(id!, {
                  onSuccess: (data) => {
                    setShowCreditNoteDialog(false);
                    navigate(`/invoices/${data.id}`);
                  },
                });
              }}
            >
              {t("invoices.createCreditNote")}
            </Button>
            <Button
              loading={deleteInvoice.isPending}
              onClick={() => {
                deleteInvoice.mutate(id!, {
                  onSuccess: () => {
                    setShowCreditNoteDialog(false);
                    navigate("/invoices");
                  },
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("invoices.deleteAnyway")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
