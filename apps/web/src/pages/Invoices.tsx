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
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeSlideUp } from "@/lib/motion";
import { Skeleton } from "@/components/ui/skeleton";

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

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients ?? []) {
      const name = c.ragioneSociale ||
        [c.nome, c.cognome].filter(Boolean).join(" ") ||
        c.codiceFiscale;
      map.set(c.id, name);
    }
    return map;
  }, [clients]);

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
    deleteInvoice.mutate(deletingInvoice.id, {
      onSuccess: () => setDeletingInvoice(undefined),
    });
  }

  function handleMarkSent() {
    if (!markSentInvoice) return;
    markSent.mutate(markSentInvoice.id, {
      onSuccess: () => setMarkSentInvoice(undefined),
    });
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
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <InvoicesSkeleton />
            </motion.div>
          ) : !invoices || invoices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center py-16"
              data-testid="empty-state"
            >
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h2 className="mt-4 text-lg font-medium">{t("invoices.emptyTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("invoices.emptyDescription")}</p>
              <Button className="mt-4" onClick={() => navigate("/invoices/new")}>
                <Plus className="mr-2 h-4 w-4" />
                {t("invoices.new")}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={fadeSlideUp}
              initial="initial"
              animate="animate"
            >
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
                      <TableCell>{clientMap.get(inv.clientId) ?? inv.clientId}</TableCell>
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
                            <DropdownMenuItem disabled={markPaid.isPending} onClick={() => markPaid.mutate(inv.id)}>
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
            </motion.div>
          )}
        </AnimatePresence>
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
            <Button
              onClick={handleDelete}
              loading={deleteInvoice.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="btn-confirm-delete"
            >
              {t("common.delete")}
            </Button>
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
            <Button
              loading={createCreditNote.isPending}
              onClick={() => {
                if (!deletingInvoice) return;
                createCreditNote.mutate(deletingInvoice.id, {
                  onSuccess: (data) => {
                    setDeletingInvoice(undefined);
                    navigate(`/invoices/${data.id}`);
                  },
                });
              }}
            >
              {t("invoices.createCreditNote")}
            </Button>
            <Button
              onClick={handleDelete}
              loading={deleteInvoice.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("invoices.deleteAnyway")}
            </Button>
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
            <Button onClick={handleMarkSent} loading={markSent.isPending}>
              {t("invoices.markSent")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-1 py-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}
