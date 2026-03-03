import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useTaxOverview, useRecordPayment, type TaxPaymentStatus } from "@/hooks/use-taxes";
import { api } from "@/lib/api";

const formatEur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const deadlineSlug = (deadline: string) =>
  deadline.replace(/_/g, "-");

function statusBadgeVariant(status: TaxPaymentStatus["status"]) {
  if (status === "paid") return "success" as const;
  if (status === "overdue") return "destructive" as const;
  return "outline" as const;
}

export function Taxes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [anno, setAnno] = useState(currentYear);

  const { data, isLoading, isError } = useTaxOverview(anno);
  const recordPayment = useRecordPayment();

  const yearOptions = Array.from({ length: 9 }, (_, i) => currentYear - 4 + i);

  return (
    <div className="space-y-6">
      {/* Header with year selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("taxes.title")}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("taxes.year")}:</span>
          <select
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm transition-colors duration-150"
            value={anno}
            onChange={(e) => setAnno(parseInt(e.target.value, 10))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      )}
      {isError && (
        <p className="text-sm text-destructive">{t("common.error")}</p>
      )}

      {data && (
        <>
          {/* Profile warning banner */}
          {data.profileIncomplete && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/40">
                <Calculator className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="text-amber-900">{t("taxes.profileRequired")}</p>
                <button
                  className="mt-1 text-sm font-medium text-amber-800 underline hover:text-amber-900 cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  {t("dashboard.goToSettings")}
                </button>
              </div>
            </div>
          )}

          {/* Tax breakdown cards — only if profile is complete */}
          {!data.profileIncomplete && data.tax && data.inps && (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Imposta Sostitutiva card */}
              <Card className="border-l-4 border-l-emerald-400">
                <CardHeader>
                  <CardTitle className="text-base">{t("dashboard.impostaSostitutiva")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.profitabilityCoeff")}</span>
                    <span>{data.tax.coefficienteRedditivita}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.grossIncome")}</span>
                    <span>{formatEur(data.tax.redditoLordo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.inpsDeduction")}</span>
                    <span className="text-muted-foreground">− {formatEur(data.inps.totaleDovuto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.taxableIncome")}</span>
                    <span>{formatEur(data.tax.redditoImponibile)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.taxRate")}</span>
                    <span className="inline-flex items-center gap-1">
                      {data.tax.aliquota}%
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {data.tax.isStartup ? t("taxes.startup") : t("taxes.ordinary")}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>{t("taxes.taxDue")}</span>
                    <span className="text-emerald-700">{formatEur(data.tax.impostaDovuta)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* INPS Contributions card */}
              <Card className="border-l-4 border-l-blue-400">
                <CardHeader>
                  <CardTitle className="text-base">{t("dashboard.inpsContributions")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.gestione")}</span>
                    <span className="capitalize">{data.inps.gestione}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.taxableIncome")}</span>
                    <span>{formatEur(data.inps.baseImponibile)}</span>
                  </div>
                  {data.inps.contributoFisso > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("taxes.contributoFisso")}</span>
                      <span>{formatEur(data.inps.contributoFisso)}</span>
                    </div>
                  )}
                  {data.inps.contributoEccedenza > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("taxes.contributoEccedenza")}</span>
                      <span>{formatEur(data.inps.contributoEccedenza)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>{t("taxes.totaleDovuto")}</span>
                    <span className="text-blue-700">{formatEur(data.inps.totaleDovuto)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Net Position card */}
              <Card className="border-l-4 border-l-amber-400">
                <CardHeader>
                  <CardTitle className="text-base">{t("taxes.netPosition")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.revenue")}</span>
                    <span>{formatEur(data.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.totalTaxes")}</span>
                    <span>− {formatEur(data.tax.impostaDovuta + data.inps.totaleDovuto)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>{t("taxes.netIncome")}</span>
                    <span className="text-emerald-700">
                      {formatEur(data.totalRevenue - data.tax.impostaDovuta - data.inps.totaleDovuto)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("taxes.effectiveRate")}</span>
                    <span>
                      {data.totalRevenue > 0
                        ? (((data.tax.impostaDovuta + data.inps.totaleDovuto) / data.totalRevenue) * 100).toFixed(1)
                        : "0.0"}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* F24 Payment Schedule */}
          {!data.profileIncomplete && data.payments && data.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("taxes.paymentSchedule")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.payments.map((payment) => (
                  <PaymentRow
                    key={payment.deadline}
                    payment={payment}
                    anno={anno}
                    recordPayment={recordPayment}
                    t={t}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Simulator link */}
          <div className="text-center">
            <Link
              to="/taxes/simulator"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("taxes.simulatorLink")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

interface PaymentRowProps {
  payment: TaxPaymentStatus;
  anno: number;
  recordPayment: ReturnType<typeof useRecordPayment>;
  t: (key: string) => string;
}

function PaymentRow({ payment, anno, recordPayment, t }: PaymentRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [amountPaid, setAmountPaid] = useState(payment.amountDue.toFixed(2));
  const [datePaid, setDatePaid] = useState(today);

  const handleConfirm = () => {
    recordPayment.mutate(
      {
        anno,
        deadline: payment.deadline,
        amountPaid: parseFloat(amountPaid),
        datePaid,
      },
      {
        onSuccess: () => setDialogOpen(false),
      }
    );
  };

  const slug = deadlineSlug(payment.deadline);
  const filename = `F24_${anno}_${payment.deadline}.pdf`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: label + due date */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{payment.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("taxes.dueDate")}:{" "}
          {new Date(payment.dueDate).toLocaleDateString("it-IT")}
        </p>
        {payment.status === "paid" && payment.datePaid && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("taxes.paymentDate")}:{" "}
            {new Date(payment.datePaid).toLocaleDateString("it-IT")}
          </p>
        )}
      </div>

      {/* Center: amount + status */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-mono font-medium">{formatEur(payment.amountDue)}</p>
          {payment.amountPaid !== null && payment.amountPaid !== payment.amountDue && (
            <p className="text-xs text-muted-foreground">
              {t("taxes.amountPaid")}: {formatEur(payment.amountPaid)}
            </p>
          )}
        </div>
        <Badge variant={statusBadgeVariant(payment.status)}>
          {t(`taxes.${payment.status}`)}
        </Badge>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => api.download(`/taxes/${anno}/f24/${slug}`, filename)}
        >
          {t("taxes.downloadF24")}
        </Button>
        {payment.status !== "paid" && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              {t("taxes.markAsPaid")}
            </Button>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("taxes.recordPayment")}</AlertDialogTitle>
                  <AlertDialogDescription>{payment.label}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`amount-${payment.deadline}`}>{t("taxes.amountPaid")}</Label>
                    <Input
                      id={`amount-${payment.deadline}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`date-${payment.deadline}`}>{t("taxes.paymentDate")}</Label>
                    <Input
                      id={`date-${payment.deadline}`}
                      type="date"
                      value={datePaid}
                      onChange={(e) => setDatePaid(e.target.value)}
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <button
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                    onClick={handleConfirm}
                    disabled={recordPayment.isPending}
                  >
                    {recordPayment.isPending ? t("common.loading") : t("common.confirm")}
                  </button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}
