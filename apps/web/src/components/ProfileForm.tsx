import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserProfile, ProfileFormData } from "@/hooks/use-profile";

interface ProfileFormProps {
  profile?: UserProfile;
  onSubmit: (data: ProfileFormData) => void;
  isLoading: boolean;
  serverErrors?: Record<string, string>;
}

export function ProfileForm({ profile, onSubmit, isLoading, serverErrors = {} }: ProfileFormProps) {
  const { t } = useTranslation();

  const [ragioneSociale, setRagioneSociale] = useState("");
  const [partitaIva, setPartitaIva] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [codiceAteco, setCodiceAteco] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [cap, setCap] = useState("");
  const [citta, setCitta] = useState("");
  const [provincia, setProvincia] = useState("");
  const [pec, setPec] = useState("");
  const [codiceSdi, setCodiceSdi] = useState("");
  const [iban, setIban] = useState("");
  const [annoInizioAttivita, setAnnoInizioAttivita] = useState(
    new Date().getFullYear()
  );
  const [gestioneInps, setGestioneInps] = useState<"separata" | "artigiani" | "commercianti">("separata");

  const initializedRef = useRef(false);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setRagioneSociale(profile.ragioneSociale);
      setPartitaIva(profile.partitaIva);
      setCodiceFiscale(profile.codiceFiscale);
      setCodiceAteco(profile.codiceAteco);
      setIndirizzo(profile.indirizzo);
      setCap(profile.cap);
      setCitta(profile.citta);
      setProvincia(profile.provincia);
      setPec(profile.pec ?? "");
      setCodiceSdi(profile.codiceSdi ?? "");
      setIban(profile.iban ?? "");
      setAnnoInizioAttivita(profile.annoInizioAttivita);
      setGestioneInps(profile.gestioneInps ?? "separata");
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ProfileFormData = {
      ragioneSociale: ragioneSociale.trim(),
      partitaIva: partitaIva.trim(),
      codiceFiscale: codiceFiscale.trim().toUpperCase(),
      codiceAteco: codiceAteco.trim(),
      indirizzo: indirizzo.trim(),
      cap: cap.trim(),
      citta: citta.trim(),
      provincia: provincia.trim().toUpperCase(),
      annoInizioAttivita,
      gestioneInps,
    };
    if (pec.trim()) data.pec = pec.trim();
    if (codiceSdi.trim()) data.codiceSdi = codiceSdi.trim();
    if (iban.trim()) data.iban = iban.trim();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ragioneSociale">
                {t("settings.businessName")}
              </Label>
              <Input
                id="ragioneSociale"
                data-testid="input-ragione-sociale"
                value={ragioneSociale}
                onChange={(e) => setRagioneSociale(e.target.value)}
                required
              />
              <AnimatePresence>
                {serverErrors.ragioneSociale && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.ragioneSociale}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partitaIva">{t("settings.vatNumber")}</Label>
              <Input
                id="partitaIva"
                data-testid="input-partita-iva"
                value={partitaIva}
                onChange={(e) => setPartitaIva(e.target.value)}
                maxLength={11}
                required
              />
              <AnimatePresence>
                {serverErrors.partitaIva && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.partitaIva}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codiceFiscale">{t("settings.taxCode")}</Label>
              <Input
                id="codiceFiscale"
                data-testid="input-codice-fiscale"
                value={codiceFiscale}
                onChange={(e) => setCodiceFiscale(e.target.value)}
                maxLength={16}
                required
              />
              <AnimatePresence>
                {serverErrors.codiceFiscale && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.codiceFiscale}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codiceAteco">{t("settings.atecoCode")}</Label>
              <Input
                id="codiceAteco"
                data-testid="input-codice-ateco"
                value={codiceAteco}
                onChange={(e) => setCodiceAteco(e.target.value)}
                required
              />
              <AnimatePresence>
                {serverErrors.codiceAteco && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.codiceAteco}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="indirizzo">{t("settings.address")}</Label>
            <Input
              id="indirizzo"
              data-testid="input-indirizzo"
              value={indirizzo}
              onChange={(e) => setIndirizzo(e.target.value)}
              required
            />
            <AnimatePresence>
              {serverErrors.indirizzo && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-destructive"
                  data-testid="field-error"
                >
                  {serverErrors.indirizzo}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cap">{t("settings.cap")}</Label>
              <Input
                id="cap"
                data-testid="input-cap"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                maxLength={5}
                required
              />
              <AnimatePresence>
                {serverErrors.cap && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.cap}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="citta">{t("settings.city")}</Label>
              <Input
                id="citta"
                data-testid="input-citta"
                value={citta}
                onChange={(e) => setCitta(e.target.value)}
                required
              />
              <AnimatePresence>
                {serverErrors.citta && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.citta}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">{t("settings.province")}</Label>
              <Input
                id="provincia"
                data-testid="input-provincia"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                maxLength={2}
                required
              />
              <AnimatePresence>
                {serverErrors.provincia && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.provincia}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pec">{t("settings.pec")}</Label>
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
                    data-testid="field-error"
                  >
                    {serverErrors.pec}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codiceSdi">{t("settings.sdiCode")}</Label>
              <Input
                id="codiceSdi"
                value={codiceSdi}
                onChange={(e) => setCodiceSdi(e.target.value)}
                maxLength={7}
                placeholder="0000000"
              />
              <AnimatePresence>
                {serverErrors.codiceSdi && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.codiceSdi}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iban">{t("settings.iban")}</Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
              />
              <AnimatePresence>
                {serverErrors.iban && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.iban}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="annoInizioAttivita">
                {t("settings.startYear")}
              </Label>
              <Input
                id="annoInizioAttivita"
                data-testid="input-anno-inizio-attivita"
                type="number"
                value={annoInizioAttivita}
                onChange={(e) =>
                  setAnnoInizioAttivita(parseInt(e.target.value) || 0)
                }
                required
              />
              <AnimatePresence>
                {serverErrors.annoInizioAttivita && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.annoInizioAttivita}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gestioneInps">{t("settings.inpsManagement")}</Label>
              <Select value={gestioneInps} onValueChange={(v) => setGestioneInps(v as "separata" | "artigiani" | "commercianti")}>
                <SelectTrigger id="gestioneInps">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="separata">{t("settings.gestSeparata")}</SelectItem>
                  <SelectItem value="artigiani">{t("settings.gestArtigiani")}</SelectItem>
                  <SelectItem value="commercianti">{t("settings.gestCommercianti")}</SelectItem>
                </SelectContent>
              </Select>
              <AnimatePresence>
                {serverErrors.gestioneInps && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-destructive"
                    data-testid="field-error"
                  >
                    {serverErrors.gestioneInps}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <Button type="submit" loading={isLoading} data-testid="btn-submit-profile">
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
