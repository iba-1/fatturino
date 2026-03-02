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
import { Pencil, Trash2, Plus } from "lucide-react";

export function Clients() {
  const { t } = useTranslation();
  const { data: clients, isLoading, isError } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deletingClient, setDeletingClient] = useState<Client | undefined>();

  function handleCreate(data: CreateClientData) {
    createClient.mutate(data, {
      onSuccess: () => {
        setFormOpen(false);
      },
    });
  }

  function handleUpdate(data: CreateClientData) {
    if (!editingClient) return;
    updateClient.mutate(
      { id: editingClient.id, data },
      {
        onSuccess: () => {
          setEditingClient(undefined);
        },
      }
    );
  }

  function handleDelete() {
    if (!deletingClient) return;
    deleteClient.mutate(deletingClient.id, {
      onSuccess: () => {
        setDeletingClient(undefined);
      },
    });
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
        <h1 className="text-3xl font-bold tracking-tight">{t("clients.title")}</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("clients.new")}
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        ) : !clients || clients.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground" data-testid="empty-state">
              {t("clients.title")} — {t("clients.new")}
            </p>
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
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingClient(client)}
                        aria-label={t("common.delete")}
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
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("clients.new")}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <ClientForm
            onSubmit={handleCreate}
            onCancel={() => setFormOpen(false)}
            isLoading={createClient.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(undefined)}
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
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
