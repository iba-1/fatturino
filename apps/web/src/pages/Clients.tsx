import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { ClientForm } from "@/components/ClientForm";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  type Client,
  type CreateClientData,
} from "@/hooks/use-clients";
import { parseApiFieldErrors } from "@/lib/api";
import { Pencil, Trash2, Plus, Users } from "lucide-react";

export function Clients() {
  const { t } = useTranslation();
  const { data: clients, isLoading, isError } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deletingClient, setDeletingClient] = useState<Client | undefined>();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  function handleCreate(data: CreateClientData) {
    setServerErrors({});
    createClient.mutate(data, {
      onSuccess: () => setFormOpen(false),
      onError: (error) => setServerErrors(parseApiFieldErrors(error)),
    });
  }

  function handleUpdate(data: CreateClientData) {
    if (!editingClient) return;
    setServerErrors({});
    updateClient.mutate(
      { id: editingClient.id, data },
      {
        onSuccess: () => setEditingClient(undefined),
        onError: (error) => setServerErrors(parseApiFieldErrors(error)),
      }
    );
  }

  function handleDelete() {
    if (!deletingClient) return;
    const id = deletingClient.id;
    setDeletingClient(undefined);
    deleteClient.mutate(id);
  }

  function getClientDisplayName(client: Client): string {
    if (client.ragioneSociale) return client.ragioneSociale;
    return [client.nome, client.cognome].filter(Boolean).join(" ") || client.codiceFiscale;
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("clients.title")}</h1>
        <Button onClick={() => setFormOpen(true)} data-testid="btn-new-client">
          <Plus className="mr-2 h-4 w-4" />
          {t("clients.new")}
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-secondary animate-skeleton" />
            ))}
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-state">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">{t("clients.noClients")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("clients.createFirst")}</p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("clients.new")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("clients.businessName")}</TableHead>
                <TableHead>{t("clients.type")}</TableHead>
                <TableHead>{t("clients.taxCode")}</TableHead>
                <TableHead>{t("clients.vatNumber")}</TableHead>
                <TableHead>{t("clients.city")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {getClientDisplayName(client)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {client.tipo === "persona_fisica"
                        ? t("clients.individual")
                        : t("clients.business")}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.codiceFiscale}</TableCell>
                  <TableCell>{client.partitaIva || "—"}</TableCell>
                  <TableCell>{client.citta}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingClient(client)}
                        aria-label={t("common.edit")}
                        data-testid="btn-edit-client"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingClient(client)}
                        aria-label={t("common.delete")}
                        data-testid="btn-delete-client"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setServerErrors({}); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("clients.new")}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <ClientForm
            onSubmit={handleCreate}
            onCancel={() => setFormOpen(false)}
            isLoading={createClient.isPending}
            serverErrors={serverErrors}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => { if (!open) { setEditingClient(undefined); setServerErrors({}); } }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("common.edit")} — {editingClient && getClientDisplayName(editingClient)}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {editingClient && (
            <ClientForm
              client={editingClient}
              onSubmit={handleUpdate}
              onCancel={() => setEditingClient(undefined)}
              isLoading={updateClient.isPending}
              serverErrors={serverErrors}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.delete")} {deletingClient && getClientDisplayName(deletingClient)}?
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
    </div>
  );
}
