import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const [email, setEmail] = useState(client?.email ?? "");
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
    if (email.trim()) data.email = email.trim();

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
        <AnimatePresence>
          {serverErrors.tipo && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-destructive"
            >
              {serverErrors.tipo}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {tipo === "persona_giuridica" && (
        <div className="space-y-2">
          <Label htmlFor="ragioneSociale">{t("clients.businessName")}</Label>
          <Input
            id="ragioneSociale"
            data-testid="input-ragione-sociale"
            value={ragioneSociale}
            onChange={(e) => setRagioneSociale(e.target.value)}
          />
          <AnimatePresence>
            {(errors.ragioneSociale || serverErrors.ragioneSociale) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {errors.ragioneSociale || serverErrors.ragioneSociale}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {tipo === "persona_fisica" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">{t("clients.firstName")}</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <AnimatePresence>
              {serverErrors.nome && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-destructive"
                >
                  {serverErrors.nome}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cognome">{t("clients.lastName")}</Label>
            <Input
              id="cognome"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
            />
            <AnimatePresence>
              {serverErrors.cognome && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-destructive"
                >
                  {serverErrors.cognome}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codiceFiscale">{t("clients.taxCode")}</Label>
          <Input
            id="codiceFiscale"
            data-testid="input-codice-fiscale"
            value={codiceFiscale}
            onChange={(e) => setCodiceFiscale(e.target.value)}
          />
          <AnimatePresence>
            {(errors.codiceFiscale || serverErrors.codiceFiscale) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {errors.codiceFiscale || serverErrors.codiceFiscale}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partitaIva">{t("clients.vatNumber")}</Label>
          <Input
            id="partitaIva"
            data-testid="input-partita-iva"
            value={partitaIva}
            onChange={(e) => setPartitaIva(e.target.value)}
            placeholder="12345678901"
          />
          <AnimatePresence>
            {(errors.partitaIva || serverErrors.partitaIva) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {errors.partitaIva || serverErrors.partitaIva}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="indirizzo">{t("clients.address")}</Label>
        <Input
          id="indirizzo"
          data-testid="input-indirizzo"
          value={indirizzo}
          onChange={(e) => setIndirizzo(e.target.value)}
        />
        <AnimatePresence>
          {(errors.indirizzo || serverErrors.indirizzo) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-destructive"
            >
              {errors.indirizzo || serverErrors.indirizzo}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cap">{t("clients.zip")}</Label>
          <Input
            id="cap"
            data-testid="input-cap"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            placeholder="00100"
          />
          <AnimatePresence>
            {(errors.cap || serverErrors.cap) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {errors.cap || serverErrors.cap}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="citta">{t("clients.city")}</Label>
          <Input
            id="citta"
            data-testid="input-citta"
            value={citta}
            onChange={(e) => setCitta(e.target.value)}
          />
          <AnimatePresence>
            {(errors.citta || serverErrors.citta) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {errors.citta || serverErrors.citta}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="provincia">{t("clients.province")}</Label>
          <Input
            id="provincia"
            data-testid="input-provincia"
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            placeholder="RM"
            maxLength={2}
          />
          <AnimatePresence>
            {(errors.provincia || serverErrors.provincia) && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {errors.provincia || serverErrors.provincia}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pec">{t("clients.pec")}</Label>
          <Input
            id="pec"
            type="email"
            value={pec}
            onChange={(e) => setPec(e.target.value)}
            placeholder="email@pec.it"
          />
          <AnimatePresence>
            {serverErrors.pec && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {serverErrors.pec}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="codiceSdi">{t("clients.sdiCode")}</Label>
          <Input
            id="codiceSdi"
            data-testid="input-codice-sdi"
            value={codiceSdi}
            onChange={(e) => setCodiceSdi(e.target.value)}
            placeholder="0000000"
            maxLength={7}
          />
          <AnimatePresence>
            {serverErrors.codiceSdi && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {serverErrors.codiceSdi}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("clients.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <AnimatePresence>
            {serverErrors.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {serverErrors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" loading={isLoading} data-testid="btn-submit-client">
          {isEdit ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}
