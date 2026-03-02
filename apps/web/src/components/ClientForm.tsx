import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, CreateClientData } from "@/hooks/use-clients";

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
}

export function ClientForm({ client, onSubmit, onCancel, isLoading, serverErrors = {} }: ClientFormProps) {
  const { t } = useTranslation();
  const isEdit = !!client;

  const [tipo, setTipo] = useState<"persona_fisica" | "persona_giuridica">(
    client?.tipo ?? "persona_giuridica"
  );
  const [ragioneSociale, setRagioneSociale] = useState(client?.ragioneSociale ?? "");
  const [nome, setNome] = useState(client?.nome ?? "");
  const [cognome, setCognome] = useState(client?.cognome ?? "");
  const [partitaIva, setPartitaIva] = useState(client?.partitaIva ?? "");
  const [codiceFiscale, setCodiceFiscale] = useState(client?.codiceFiscale ?? "");
  const [codiceSdi, setCodiceSdi] = useState(client?.codiceSdi ?? "");
  const [pec, setPec] = useState(client?.pec ?? "");
  const [indirizzo, setIndirizzo] = useState(client?.indirizzo ?? "");
  const [cap, setCap] = useState(client?.cap ?? "");
  const [citta, setCitta] = useState(client?.citta ?? "");
  const [provincia, setProvincia] = useState(client?.provincia ?? "");
  const [nazione, setNazione] = useState(client?.nazione ?? "IT");

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!codiceFiscale.trim()) {
      newErrors.codiceFiscale = t("clients.taxCode") + " is required";
    }
    if (!indirizzo.trim()) {
      newErrors.indirizzo = t("clients.address") + " is required";
    }
    if (!cap.trim() || !/^\d{5}$/.test(cap)) {
      newErrors.cap = t("clients.zip") + " must be 5 digits";
    }
    if (!citta.trim()) {
      newErrors.citta = t("clients.city") + " is required";
    }
    if (!provincia.trim() || provincia.length !== 2) {
      newErrors.provincia = t("clients.province") + " must be 2 characters";
    }
    if (partitaIva && !/^\d{11}$/.test(partitaIva)) {
      newErrors.partitaIva = t("clients.vatNumber") + " must be 11 digits";
    }
    if (tipo === "persona_giuridica" && !ragioneSociale.trim()) {
      newErrors.ragioneSociale = t("clients.businessName") + " is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateClientData = {
      tipo,
      codiceFiscale: codiceFiscale.trim(),
      indirizzo: indirizzo.trim(),
      cap: cap.trim(),
      citta: citta.trim(),
      provincia: provincia.trim().toUpperCase(),
      nazione: nazione.trim().toUpperCase() || "IT",
    };

    if (ragioneSociale.trim()) data.ragioneSociale = ragioneSociale.trim();
    if (nome.trim()) data.nome = nome.trim();
    if (cognome.trim()) data.cognome = cognome.trim();
    if (partitaIva.trim()) data.partitaIva = partitaIva.trim();
    if (codiceSdi.trim()) data.codiceSdi = codiceSdi.trim();
    if (pec.trim()) data.pec = pec.trim();

    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tipo">{t("clients.type")}</Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger id="tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="persona_giuridica">{t("clients.business")}</SelectItem>
            <SelectItem value="persona_fisica">{t("clients.individual")}</SelectItem>
          </SelectContent>
        </Select>
        {serverErrors.tipo && (
          <p className="text-sm text-destructive">{serverErrors.tipo}</p>
        )}
      </div>

      {tipo === "persona_giuridica" && (
        <div className="space-y-2">
          <Label htmlFor="ragioneSociale">{t("clients.businessName")}</Label>
          <Input
            id="ragioneSociale"
            value={ragioneSociale}
            onChange={(e) => setRagioneSociale(e.target.value)}
          />
          {(errors.ragioneSociale || serverErrors.ragioneSociale) && (
            <p className="text-sm text-destructive">{errors.ragioneSociale || serverErrors.ragioneSociale}</p>
          )}
        </div>
      )}

      {tipo === "persona_fisica" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">{t("clients.firstName")}</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            {serverErrors.nome && (
              <p className="text-sm text-destructive">{serverErrors.nome}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cognome">{t("clients.lastName")}</Label>
            <Input
              id="cognome"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
            />
            {serverErrors.cognome && (
              <p className="text-sm text-destructive">{serverErrors.cognome}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codiceFiscale">{t("clients.taxCode")}</Label>
          <Input
            id="codiceFiscale"
            value={codiceFiscale}
            onChange={(e) => setCodiceFiscale(e.target.value)}
          />
          {(errors.codiceFiscale || serverErrors.codiceFiscale) && (
            <p className="text-sm text-destructive">{errors.codiceFiscale || serverErrors.codiceFiscale}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="partitaIva">{t("clients.vatNumber")}</Label>
          <Input
            id="partitaIva"
            value={partitaIva}
            onChange={(e) => setPartitaIva(e.target.value)}
            placeholder="12345678901"
          />
          {(errors.partitaIva || serverErrors.partitaIva) && (
            <p className="text-sm text-destructive">{errors.partitaIva || serverErrors.partitaIva}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="indirizzo">{t("clients.address")}</Label>
        <Input
          id="indirizzo"
          value={indirizzo}
          onChange={(e) => setIndirizzo(e.target.value)}
        />
        {(errors.indirizzo || serverErrors.indirizzo) && (
          <p className="text-sm text-destructive">{errors.indirizzo || serverErrors.indirizzo}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cap">{t("clients.zip")}</Label>
          <Input
            id="cap"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            placeholder="00100"
          />
          {(errors.cap || serverErrors.cap) && (
            <p className="text-sm text-destructive">{errors.cap || serverErrors.cap}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="citta">{t("clients.city")}</Label>
          <Input
            id="citta"
            value={citta}
            onChange={(e) => setCitta(e.target.value)}
          />
          {(errors.citta || serverErrors.citta) && (
            <p className="text-sm text-destructive">{errors.citta || serverErrors.citta}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="provincia">{t("clients.province")}</Label>
          <Input
            id="provincia"
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            placeholder="RM"
            maxLength={2}
          />
          {(errors.provincia || serverErrors.provincia) && (
            <p className="text-sm text-destructive">{errors.provincia || serverErrors.provincia}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pec">{t("clients.pec")}</Label>
          <Input
            id="pec"
            type="email"
            value={pec}
            onChange={(e) => setPec(e.target.value)}
            placeholder="email@pec.it"
          />
          {serverErrors.pec && (
            <p className="text-sm text-destructive">{serverErrors.pec}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="codiceSdi">{t("clients.sdiCode")}</Label>
          <Input
            id="codiceSdi"
            value={codiceSdi}
            onChange={(e) => setCodiceSdi(e.target.value)}
            placeholder="0000000"
            maxLength={7}
          />
          {serverErrors.codiceSdi && (
            <p className="text-sm text-destructive">{serverErrors.codiceSdi}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : isEdit ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}
