import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SOGLIA_BOLLO, IMPORTO_BOLLO, DISCLAIMER_FORFETTARIO } from "@fatturino/shared";
import type { Client } from "@/hooks/use-clients";
import type { CreateInvoiceData, CreateInvoiceLineData } from "@/hooks/use-invoices";
import { Plus, Trash2 } from "lucide-react";

interface InvoiceFormProps {
  clients: Client[];
  onSubmit: (data: CreateInvoiceData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
  initialData?: {
    clientId: string;
    tipoDocumento: string;
    dataEmissione: string;
    causale: string | null;
    lines: { descrizione: string; quantita: string; prezzoUnitario: string }[];
  };
}

function emptyLine(): CreateInvoiceLineData {
  return { descrizione: "", quantita: 1, prezzoUnitario: 0 };
}

export function calculateLineTotal(line: CreateInvoiceLineData): number {
  return Math.round(line.quantita * line.prezzoUnitario * 100) / 100;
}

export function calculateSubtotal(lines: CreateInvoiceLineData[]): number {
  return Math.round(
    lines.reduce((sum, line) => sum + calculateLineTotal(line), 0) * 100
  ) / 100;
}

export function InvoiceForm({ clients, onSubmit, onCancel, isLoading, serverErrors = {}, initialData }: InvoiceFormProps) {
  const { t } = useTranslation();

  const [clientId, setClientId] = useState(initialData?.clientId ?? "");
  const [tipoDocumento, setTipoDocumento] = useState(initialData?.tipoDocumento ?? "TD01");
  const [dataEmissione, setDataEmissione] = useState(
    initialData?.dataEmissione ?? new Date().toISOString().split("T")[0]
  );
  const [causale, setCausale] = useState(initialData?.causale ?? "");
  const [lines, setLines] = useState<CreateInvoiceLineData[]>(
    initialData?.lines?.map((l) => ({
      descrizione: l.descrizione,
      quantita: parseFloat(l.quantita),
      prezzoUnitario: parseFloat(l.prezzoUnitario),
    })) ?? [emptyLine()]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = calculateSubtotal(lines);
  const bollo = subtotal > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
  const total = Math.round((subtotal + bollo) * 100) / 100;

  function addLine() {
    setLines([...lines, emptyLine()]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof CreateInvoiceLineData, value: string | number) {
    setLines(
      lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!clientId) {
      newErrors.clientId = t("invoices.client") + " is required";
    }
    if (!dataEmissione || !/^\d{4}-\d{2}-\d{2}$/.test(dataEmissione)) {
      newErrors.dataEmissione = t("invoices.date") + " is required";
    }

    const hasEmptyLine = lines.some((l) => !l.descrizione.trim());
    if (hasEmptyLine) {
      newErrors.lines = t("invoices.description") + " is required for all lines";
    }

    const hasZeroPrice = lines.some((l) => l.prezzoUnitario <= 0);
    if (hasZeroPrice) {
      newErrors.lines = t("invoices.unitPrice") + " must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateInvoiceData = {
      clientId,
      tipoDocumento,
      dataEmissione,
      lines: lines.map((l) => ({
        descrizione: l.descrizione.trim(),
        quantita: l.quantita,
        prezzoUnitario: l.prezzoUnitario,
      })),
    };

    if (causale.trim()) {
      data.causale = causale.trim();
    }

    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">{t("invoices.client")}</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="clientId" data-testid="invoice-client-select">
              <SelectValue placeholder={t("invoices.client")} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.ragioneSociale ||
                    [c.nome, c.cognome].filter(Boolean).join(" ") ||
                    c.codiceFiscale}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(errors.clientId || serverErrors.clientId) && (
            <p className="text-sm text-destructive">{errors.clientId || serverErrors.clientId}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataEmissione">{t("invoices.date")}</Label>
          <Input
            id="dataEmissione"
            type="date"
            value={dataEmissione}
            onChange={(e) => setDataEmissione(e.target.value)}
          />
          {(errors.dataEmissione || serverErrors.dataEmissione) && (
            <p className="text-sm text-destructive">{errors.dataEmissione || serverErrors.dataEmissione}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipoDocumento">Tipo Documento</Label>
          <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
            <SelectTrigger id="tipoDocumento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TD01">TD01 — Fattura</SelectItem>
              <SelectItem value="TD06">TD06 — Parcella</SelectItem>
              <SelectItem value="TD24">TD24 — Fattura differita</SelectItem>
            </SelectContent>
          </Select>
          {serverErrors.tipoDocumento && (
            <p className="text-sm text-destructive">{serverErrors.tipoDocumento}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="causale">Causale</Label>
          <Input
            id="causale"
            value={causale}
            onChange={(e) => setCausale(e.target.value)}
            placeholder="Descrizione della prestazione"
          />
          {serverErrors.causale && (
            <p className="text-sm text-destructive">{serverErrors.causale}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Righe fattura</h3>
          <Button type="button" variant="outline" size="sm" onClick={addLine} data-testid="btn-add-line">
            <Plus className="mr-1 h-4 w-4" />
            {t("invoices.addLine")}
          </Button>
        </div>

        {(errors.lines || serverErrors.lines) && (
          <p className="text-sm text-destructive mb-2">{errors.lines || serverErrors.lines}</p>
        )}

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_100px_120px_100px_40px] gap-2 items-end"
              data-testid={`line-item-${index}`}
            >
              <div className="space-y-1">
                {index === 0 && (
                  <Label className="text-xs">{t("invoices.description")}</Label>
                )}
                <Input
                  value={line.descrizione}
                  onChange={(e) => updateLine(index, "descrizione", e.target.value)}
                  placeholder={t("invoices.description")}
                  data-testid={`input-description-${index}`}
                />
              </div>
              <div className="space-y-1">
                {index === 0 && (
                  <Label className="text-xs">{t("invoices.quantity")}</Label>
                )}
                <Input
                  className="font-mono"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={line.quantita}
                  onChange={(e) =>
                    updateLine(index, "quantita", parseFloat(e.target.value) || 0)
                  }
                  data-testid={`input-quantity-${index}`}
                />
              </div>
              <div className="space-y-1">
                {index === 0 && (
                  <Label className="text-xs">{t("invoices.unitPrice")}</Label>
                )}
                <Input
                  className="font-mono"
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.prezzoUnitario}
                  onChange={(e) =>
                    updateLine(index, "prezzoUnitario", parseFloat(e.target.value) || 0)
                  }
                  data-testid={`input-unit-price-${index}`}
                />
              </div>
              <div className="space-y-1">
                {index === 0 && (
                  <Label className="text-xs">{t("invoices.lineTotal")}</Label>
                )}
                <div className="flex h-10 items-center px-3 text-sm font-medium font-mono">
                  {calculateLineTotal(line).toFixed(2)}
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 1}
                  className="h-10 w-10"
                  data-testid={`btn-remove-line-${index}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Totals */}
      <div className="flex flex-col items-end space-y-2" data-testid="invoice-totals">
        <div className="flex gap-8 text-sm">
          <span className="text-muted-foreground">{t("invoices.subtotal")}</span>
          <span className="font-medium font-mono w-24 text-right">
            {subtotal.toFixed(2)}
          </span>
        </div>
        {bollo > 0 && (
          <div className="flex gap-8 text-sm" data-testid="bollo-row">
            <span className="text-muted-foreground">{t("invoices.bollo")}</span>
            <span className="font-medium font-mono w-24 text-right">
              {bollo.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex gap-8 text-base font-bold">
          <span>{t("invoices.total")}</span>
          <span className="font-mono w-24 text-right">{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Forfettario disclaimer */}
      <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground" data-testid="forfettario-disclaimer">
        {DISCLAIMER_FORFETTARIO}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="btn-submit-invoice">
          {isLoading ? t("common.loading") : initialData ? t("common.save") : t("common.create")}
        </Button>
      </div>
    </form>
  );
}
