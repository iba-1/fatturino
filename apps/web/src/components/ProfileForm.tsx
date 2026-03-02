import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile, ProfileFormData } from "@/hooks/use-profile";

interface ProfileFormProps {
  profile?: UserProfile;
  onSubmit: (data: ProfileFormData) => void;
  isLoading: boolean;
}

export function ProfileForm({ profile, onSubmit, isLoading }: ProfileFormProps) {
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
                value={ragioneSociale}
                onChange={(e) => setRagioneSociale(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partitaIva">{t("settings.vatNumber")}</Label>
              <Input
                id="partitaIva"
                value={partitaIva}
                onChange={(e) => setPartitaIva(e.target.value)}
                maxLength={11}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codiceFiscale">{t("settings.taxCode")}</Label>
              <Input
                id="codiceFiscale"
                value={codiceFiscale}
                onChange={(e) => setCodiceFiscale(e.target.value)}
                maxLength={16}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codiceAteco">{t("settings.atecoCode")}</Label>
              <Input
                id="codiceAteco"
                value={codiceAteco}
                onChange={(e) => setCodiceAteco(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="indirizzo">{t("settings.address")}</Label>
            <Input
              id="indirizzo"
              value={indirizzo}
              onChange={(e) => setIndirizzo(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cap">{t("settings.cap")}</Label>
              <Input
                id="cap"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citta">{t("settings.city")}</Label>
              <Input
                id="citta"
                value={citta}
                onChange={(e) => setCitta(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">{t("settings.province")}</Label>
              <Input
                id="provincia"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                maxLength={2}
                required
              />
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
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iban">{t("settings.iban")}</Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annoInizioAttivita">
                {t("settings.startYear")}
              </Label>
              <Input
                id="annoInizioAttivita"
                type="number"
                value={annoInizioAttivita}
                onChange={(e) =>
                  setAnnoInizioAttivita(parseInt(e.target.value) || 0)
                }
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("common.loading") : t("common.save")}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
