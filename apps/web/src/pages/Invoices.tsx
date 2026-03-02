import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
import { useInvoices, useDeleteInvoice, type Invoice } from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import { Plus, Trash2, Eye } from "lucide-react";
import { useState } from "react";

function statusVariant(stato: string): "default" | "secondary" | "destructive" | "outline" {
  switch (stato) {
    case "consegnata":
    case "accettata":
      return "default";
    case "inviata":
      return "secondary";
    case "scartata":
    case "rifiutata":
      return "destructive";
    default:
      return "outline";
  }
}

export function Invoices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: invoices, isLoading, isError } = useInvoices();
  const { data: clients } = useClients();
  const deleteInvoice = useDeleteInvoice();
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | undefined>();

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
    };
    return map[stato] || stato;
  }

  function handleDelete() {
    if (!deletingInvoice) return;
    deleteInvoice.mutate(deletingInvoice.id, {
      onSuccess: () => setDeletingInvoice(undefined),
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
        <h1 className="text-3xl font-bold tracking-tight">{t("invoices.title")}</h1>
        <Button onClick={() => navigate("/invoices/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("invoices.new")}
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        ) : !invoices || invoices.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground" data-testid="empty-state">
              {t("invoices.title")} — {t("invoices.new")}
            </p>
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
                  <TableCell>
                    {parseFloat(inv.totaleDocumento).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.stato)}>
                      {getStatusLabel(inv.stato)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {inv.stato === "bozza" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingInvoice(inv)}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.delete")} {deletingInvoice && `${deletingInvoice.numeroFattura}/${deletingInvoice.anno}`}?
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
