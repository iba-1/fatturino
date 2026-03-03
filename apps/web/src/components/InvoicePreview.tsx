import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DISCLAIMER_FORFETTARIO, SOGLIA_BOLLO, IMPORTO_BOLLO } from "@fatturino/shared";
import type { InvoiceWithLines } from "@/hooks/use-invoices";
import type { Client } from "@/hooks/use-clients";

interface InvoicePreviewProps {
  invoice: InvoiceWithLines;
  client?: Client;
}

export function InvoicePreview({ invoice, client }: InvoicePreviewProps) {
  const { t } = useTranslation();

  const subtotal = parseFloat(invoice.imponibile);
  const bollo = parseFloat(invoice.impostaBollo);
  const total = parseFloat(invoice.totaleDocumento);

  return (
    <Card className="max-w-2xl mx-auto" data-testid="invoice-preview">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">
              Fattura {invoice.numeroFattura}/{invoice.anno}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date(invoice.dataEmissione).toLocaleDateString("it-IT")}
            </p>
          </div>
          <Badge
            variant={
              invoice.stato === "bozza"
                ? "outline"
                : invoice.stato === "scartata"
                ? "destructive"
                : "default"
            }
          >
            {invoice.stato.charAt(0).toUpperCase() + invoice.stato.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Client info */}
        {client && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              {t("invoices.client")}
            </h3>
            <p className="font-medium">
              {client.ragioneSociale ||
                [client.nome, client.cognome].filter(Boolean).join(" ")}
            </p>
            <p className="text-sm text-muted-foreground">
              {client.indirizzo}, {client.cap} {client.citta} ({client.provincia})
            </p>
            {client.partitaIva && (
              <p className="text-sm text-muted-foreground">
                P.IVA: {client.partitaIva}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              C.F.: {client.codiceFiscale}
            </p>
          </div>
        )}

        <Separator />

        {/* Line items */}
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">{t("invoices.description")}</th>
                <th className="text-right py-2">{t("invoices.quantity")}</th>
                <th className="text-right py-2">{t("invoices.unitPrice")}</th>
                <th className="text-right py-2">{t("invoices.lineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.id} className="border-b">
                  <td className="py-2">{line.descrizione}</td>
                  <td className="text-right py-2 font-mono">
                    {parseFloat(line.quantita).toFixed(2)}
                  </td>
                  <td className="text-right py-2 font-mono">
                    {parseFloat(line.prezzoUnitario).toFixed(2)}
                  </td>
                  <td className="text-right py-2 font-mono">
                    {parseFloat(line.prezzoTotale).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator />

        {/* Totals */}
        <div className="flex flex-col items-end space-y-1">
          <div className="flex gap-8 text-sm">
            <span className="text-muted-foreground">{t("invoices.subtotal")}</span>
            <span className="font-mono w-24 text-right">{subtotal.toFixed(2)}</span>
          </div>
          {bollo > 0 && (
            <div className="flex gap-8 text-sm">
              <span className="text-muted-foreground">{t("invoices.bollo")}</span>
              <span className="font-mono w-24 text-right">{bollo.toFixed(2)}</span>
            </div>
          )}
          <div className="flex gap-8 text-base font-bold border-t pt-1">
            <span>{t("invoices.total")}</span>
            <span className="font-mono w-24 text-right">{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Forfettario disclaimer */}
        <div
          className="mt-4 border-t pt-4 text-xs text-muted-foreground italic"
          data-testid="forfettario-disclaimer"
        >
          {DISCLAIMER_FORFETTARIO}
        </div>

        {/* Causale */}
        {invoice.causale && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Causale:</span> {invoice.causale}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
