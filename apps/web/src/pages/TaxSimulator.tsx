import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeSlideUp } from "@/lib/motion";
import { ArrowLeft, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calcolaImposta,
  calcolaInps,
  calcolaAccontoSaldo,
  type GestioneInps,
} from "@fatturino/shared";
import { useProfile } from "@/hooks/use-profile";
import { api } from "@/lib/api";
import { formatEur } from "@/lib/format";

const GESTIONE_OPTIONS: { value: GestioneInps; labelKey: string }[] = [
  { value: "separata", labelKey: "taxes.gestioneSeparata" },
  { value: "artigiani", labelKey: "taxes.gestioneArtigiani" },
  { value: "commercianti", labelKey: "taxes.gestioneCommercianti" },
];

export function TaxSimulator() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const currentYear = new Date().getFullYear();

  const { data: profile } = useProfile();

  // Form state — pre-filled from profile when available
  const [fatturato, setFatturato] = useState("");
  const [codiceAteco, setCodiceAteco] = useState(profile?.codiceAteco ?? "");
  const [gestione, setGestione] = useState<GestioneInps>(
    profile?.gestioneInps ?? "separata"
  );
  const [annoInizioAttivita, setAnnoInizioAttivita] = useState(
    String(profile?.annoInizioAttivita ?? currentYear)
  );
  const [annoFiscale, setAnnoFiscale] = useState(String(currentYear));

  // Sync profile pre-fill once loaded (only if user hasn't typed yet)
  const [profileApplied, setProfileApplied] = useState(false);
  useEffect(() => {
    if (profile && !profileApplied) {
      if (!codiceAteco) setCodiceAteco(profile.codiceAteco);
      if (!annoInizioAttivita || annoInizioAttivita === String(currentYear)) {
        setAnnoInizioAttivita(String(profile.annoInizioAttivita));
      }
      setGestione(profile.gestioneInps);
      setProfileApplied(true);
    }
  }, [profile, profileApplied, codiceAteco, annoInizioAttivita, currentYear]);

  const fatturatoNum = parseFloat(fatturato) || 0;
  const annoInizioNum = parseInt(annoInizioAttivita, 10) || currentYear;
  const annoFiscaleNum = parseInt(annoFiscale, 10) || currentYear;

  type SimResult = {
    inps: ReturnType<typeof calcolaInps>;
    tax: ReturnType<typeof calcolaImposta>;
    accontoSaldo: ReturnType<typeof calcolaAccontoSaldo>;
  };

  const { result, calcError } = useMemo<{ result: SimResult | null; calcError: string | null }>(() => {
    if (fatturatoNum <= 0 || !codiceAteco.trim()) {
      return { result: null, calcError: null };
    }
    try {
      const inps = calcolaInps({
        fatturato: fatturatoNum,
        codiceAteco: codiceAteco.trim(),
        gestione,
      });
      const tax = calcolaImposta({
        fatturato: fatturatoNum,
        codiceAteco: codiceAteco.trim(),
        contributiInpsVersati: inps.totaleDovuto,
        annoInizioAttivita: annoInizioNum,
        annoFiscale: annoFiscaleNum,
      });
      const accontoSaldo = calcolaAccontoSaldo({
        impostaDovuta: tax.impostaDovuta,
        accontiVersati: 0,
        anno: annoFiscaleNum,
      });
      return { result: { inps, tax, accontoSaldo }, calcError: null };
    } catch (err) {
      return { result: null, calcError: err instanceof Error ? err.message : String(err) };
    }
  }, [fatturatoNum, codiceAteco, gestione, annoInizioNum, annoFiscaleNum]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/taxes")}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          data-testid="btn-back"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("taxes.simulator")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("taxes.simulatorDescription")}
          </p>
        </div>
      </div>

      {/* Input form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            {t("taxes.simulator")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Revenue */}
            <div className="space-y-1.5">
              <Label htmlFor="fatturato">{t("taxes.annualRevenue")} *</Label>
              <Input
                id="fatturato"
                data-testid="input-fatturato"
                type="number"
                min="0"
                step="100"
                placeholder="0.00"
                value={fatturato}
                onChange={(e) => setFatturato(e.target.value)}
              />
            </div>

            {/* ATECO code */}
            <div className="space-y-1.5">
              <Label htmlFor="codiceAteco">{t("taxes.atecoCode")}</Label>
              <Input
                id="codiceAteco"
                data-testid="input-codice-ateco"
                type="text"
                placeholder="62.01.09"
                value={codiceAteco}
                onChange={(e) => setCodiceAteco(e.target.value)}
              />
            </div>

            {/* Gestione INPS */}
            <div className="space-y-1.5">
              <Label htmlFor="gestione">{t("taxes.gestione")}</Label>
              <select
                id="gestione"
                data-testid="select-gestione"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={gestione}
                onChange={(e) => setGestione(e.target.value as GestioneInps)}
              >
                {GESTIONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Anno inizio attività */}
            <div className="space-y-1.5">
              <Label htmlFor="annoInizio">{t("taxes.startYear")}</Label>
              <Input
                id="annoInizio"
                data-testid="input-anno-inizio"
                type="number"
                min="2000"
                max={currentYear}
                value={annoInizioAttivita}
                onChange={(e) => setAnnoInizioAttivita(e.target.value)}
              />
            </div>

            {/* Anno fiscale */}
            <div className="space-y-1.5">
              <Label htmlFor="annoFiscale">{t("taxes.fiscalYear")}</Label>
              <Input
                id="annoFiscale"
                data-testid="input-anno-fiscale"
                type="number"
                min="2020"
                max={currentYear + 1}
                value={annoFiscale}
                onChange={(e) => setAnnoFiscale(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ATECO error warning */}
      {calcError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" data-testid="error-banner">
          {calcError}
        </div>
      )}

      {/* Empty state */}
      {!result && !calcError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center" data-testid="simulator-empty-state">
          <Calculator className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("taxes.simulatorEmptyState")}
          </p>
        </div>
      )}

      {/* Results: 3 cards */}
      {result && (
        <>
          <motion.div
            className="grid gap-4 md:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            data-testid="simulator-results"
          >
            {/* Imposta Sostitutiva card */}
            <motion.div variants={staggerItem}>
            <Card className="bg-success/5">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("dashboard.impostaSostitutiva")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.profitabilityCoeff")}
                  </span>
                  <span>{result.tax.coefficienteRedditivita}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.grossIncome")}
                  </span>
                  <span>{formatEur(result.tax.redditoLordo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.inpsDeduction")}
                  </span>
                  <span className="text-muted-foreground">
                    − {formatEur(result.inps.totaleDovuto)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.taxableIncome")}
                  </span>
                  <span>{formatEur(result.tax.redditoImponibile)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.taxRate")}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {result.tax.aliquota}%
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {result.tax.isStartup
                        ? t("taxes.startup")
                        : t("taxes.ordinary")}
                    </Badge>
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>{t("taxes.taxDue")}</span>
                  <span className="text-success-foreground">
                    {formatEur(result.tax.impostaDovuta)}
                  </span>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* INPS Contributions card */}
            <motion.div variants={staggerItem}>
            <Card className="bg-info/5">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("dashboard.inpsContributions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.gestione")}
                  </span>
                  <span className="capitalize">{gestione}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.taxableIncome")}
                  </span>
                  <span>{formatEur(result.inps.baseImponibile)}</span>
                </div>
                {result.inps.contributoFisso > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("taxes.contributoFisso")}
                    </span>
                    <span>{formatEur(result.inps.contributoFisso)}</span>
                  </div>
                )}
                {result.inps.contributoEccedenza > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("taxes.contributoEccedenza")}
                    </span>
                    <span>{formatEur(result.inps.contributoEccedenza)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>{t("taxes.totaleDovuto")}</span>
                  <span className="text-info-foreground">
                    {formatEur(result.inps.totaleDovuto)}
                  </span>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Net Position card */}
            <motion.div variants={staggerItem}>
            <Card className="bg-warning/5">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("taxes.netPosition")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.revenue")}
                  </span>
                  <span>{formatEur(fatturatoNum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.totalTaxes")}
                  </span>
                  <span>
                    −{" "}
                    {formatEur(
                      result.tax.impostaDovuta + result.inps.totaleDovuto
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>{t("taxes.netIncome")}</span>
                  <span className="text-success-foreground">
                    {formatEur(
                      fatturatoNum -
                        result.tax.impostaDovuta -
                        result.inps.totaleDovuto
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("taxes.effectiveRate")}
                  </span>
                  <span>
                    {fatturatoNum > 0
                      ? (
                          ((result.tax.impostaDovuta +
                            result.inps.totaleDovuto) /
                            fatturatoNum) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </motion.div>

          {/* F24 Download buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("taxes.downloadSimulatedF24")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="btn-download-f24-primo-acconto"
                  onClick={() =>
                    api.download(
                      `/taxes/${annoFiscaleNum}/f24/primo-acconto?amount=${result.accontoSaldo.primoAcconto}`,
                      "F24_sim_primo_acconto.pdf"
                    )
                  }
                >
                  {t("dashboard.primoAcconto")} —{" "}
                  {formatEur(result.accontoSaldo.primoAcconto)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="btn-download-f24-secondo-acconto"
                  onClick={() =>
                    api.download(
                      `/taxes/${annoFiscaleNum}/f24/secondo-acconto?amount=${result.accontoSaldo.secondoAcconto}`,
                      "F24_sim_secondo_acconto.pdf"
                    )
                  }
                >
                  {t("dashboard.secondoAcconto")} —{" "}
                  {formatEur(result.accontoSaldo.secondoAcconto)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="btn-download-f24-saldo"
                  onClick={() =>
                    api.download(
                      `/taxes/${annoFiscaleNum}/f24/saldo?amount=${result.accontoSaldo.saldo}`,
                      "F24_sim_saldo.pdf"
                    )
                  }
                >
                  {t("dashboard.saldo")} — {formatEur(result.accontoSaldo.saldo)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
