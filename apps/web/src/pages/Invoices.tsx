import { useTranslation } from "react-i18next";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useInvoices,
  useDeleteInvoice,
  useMarkSent,
  useMarkPaid,
  useCreateCreditNote,
  type Invoice,
} from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import {
  Plus,
  Trash2,
  Eye,
  FileText,
  Pencil,
  MoreHorizontal,
  Send,
  CheckCircle,
  CircleOff,
} from "lucide-react";
import { useState } from "react";

function statusVariant(stato: string): "default" | "secondary" | "destructive" | "outline" | "warning" | "success" {
  switch (stato) {
    case "consegnata":
    case "accettata":
      return "success";
    case "inviata":
      return "default";
    case "scartata":
    case "rifiutata":
      return "destructive";
    case "bozza":
      return "warning";
    case "stornata":
      return "secondary";
    default:
      return "outline";
  }
}

export function Invoices() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const { data: invoices, isLoading, isError } = useInvoices();
  const { data: clients } = useClients();
  const deleteInvoice = useDeleteInvoice();
  const markSent = useMarkSent();
  const markPaid = useMarkPaid();
  const createCreditNote = useCreateCreditNote();
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | undefined>();
  const [markSentInvoice, setMarkSentInvoice] = useState<Invoice | undefined>();

  function getClientName(clientId: string): string {
    const client = clients?.find((c) => c.id === clientId);
    if (!client) return clientId;
    return client.ragioneSociale ||
      [client.nome, client.cognome].filter(Boolean).join(" ") ||
      client.codiceFiscale;
  }

  function getStatusLabel(stato: string): string {
    const map: Record<string, string> = {
      bozza: t("invoices.draft"),
      inviata: t("invoices.sent"),
      consegnata: t("invoices.delivered"),
      scartata: t("invoices.rejected"),
      accettata: t("invoices.accepted"),
      stornata: t("invoices.stornata"),
    };
    return map[stato] || stato;
  }

  function handleDelete() {
    if (!deletingInvoice) return;
    const id = deletingInvoice.id;
    setDeletingInvoice(undefined);
    deleteInvoice.mutate(id);
  }

  function handleMarkSent() {
    if (!markSentInvoice) return;
    const id = markSentInvoice.id;
    setMarkSentInvoice(undefined);
    markSent.mutate(id);
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("invoices.title")}</h1>
        <Button onClick={() => navigate("/invoices/new")} data-testid="btn-new-invoice">
          <Plus className="mr-2 h-4 w-4" />
          {t("invoices.new")}
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-secondary animate-skeleton" />
            ))}
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-state">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">{t("invoices.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("invoices.new")}</p>
            <Button className="mt-4" onClick={() => navigate("/invoices/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("invoices.new")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoices.number")}</TableHead>
                <TableHead>{t("invoices.date")}</TableHead>
                <TableHead>{t("invoices.client")}</TableHead>
                <TableHead>{t("invoices.amount")}</TableHead>
                <TableHead>{t("invoices.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    {inv.numeroFattura}/{inv.anno}
                  </TableCell>
                  <TableCell>
                    {new Date(inv.dataEmissione).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>{getClientName(inv.clientId)}</TableCell>
                  <TableCell className="font-mono">
                    {parseFloat(inv.totaleDocumento).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusVariant(inv.stato)}>
                        {getStatusLabel(inv.stato)}
                      </Badge>
                      {inv.pagata && (
                        <Badge variant="success">
                          {t("invoices.paid")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="actions-trigger">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}`)}>
                          <Eye className="h-4 w-4" />
                          {t("common.view")}
                        </DropdownMenuItem>
                        {inv.stato === "bozza" && (
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                            <Pencil className="h-4 w-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                        )}
                        {inv.stato === "bozza" && (
                          <DropdownMenuItem onClick={() => setMarkSentInvoice(inv)}>
                            <Send className="h-4 w-4" />
                            {t("invoices.markSent")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => markPaid.mutate(inv.id)}>
                          {inv.pagata ? (
                            <>
                              <CircleOff className="h-4 w-4" />
                              {t("invoices.markUnpaid")}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              {t("invoices.markPaid")}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {inv.stato !== "stornata" && !inv.creditNoteId && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingInvoice(inv)}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation — draft invoices */}
      <AlertDialog
        open={!!deletingInvoice && deletingInvoice.stato === "bozza"}
        onOpenChange={(open) => !open && setDeletingInvoice(undefined)}
      >
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
              data-testid="btn-confirm-delete"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation — sent invoices (offer credit note) */}
      <AlertDialog
        open={!!deletingInvoice && deletingInvoice.stato !== "bozza"}
        onOpenChange={(open) => !open && setDeletingInvoice(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.deleteAnywayTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.deleteAnywayDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deletingInvoice) return;
                const invoiceId = deletingInvoice.id;
                setDeletingInvoice(undefined);
                createCreditNote.mutate(invoiceId, {
                  onSuccess: (data) => navigate(`/invoices/${data.id}`),
                });
              }}
            >
              {t("invoices.createCreditNote")}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("invoices.deleteAnyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Sent Confirmation */}
      <AlertDialog
        open={!!markSentInvoice}
        onOpenChange={(open) => !open && setMarkSentInvoice(undefined)}
      >
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
    </div>
  );
}
