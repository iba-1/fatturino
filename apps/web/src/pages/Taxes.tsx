import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeSlideUp } from "@/lib/motion";
import { Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatEur } from "@/lib/format";

const deadlineSlug = (deadline: string) =>
  deadline.replace(/_/g, "-");

function statusBadgeVariant(status: TaxPaymentStatus["status"]) {
  if (status === "paid") return "success" as const;
  if (status === "overdue") return "destructive" as const;
  return "outline" as const;
}

export function Taxes() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
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
          <Select value={String(anno)} onValueChange={(val) => setAnno(Number(val))}>
            <SelectTrigger className="w-32" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      )}
      {isError && (
        <p className="text-sm text-destructive">{t("common.error")}</p>
      )}

      {data && (
        <>
          {/* Profile warning banner */}
          {data.profileIncomplete && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm flex items-start gap-3" data-testid="profile-warning">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/40">
                <Calculator className="h-4 w-4 text-warning-foreground" />
              </div>
              <div>
                <p className="text-warning-foreground">{t("taxes.profileRequired")}</p>
                <button
                  type="button"
                  className="mt-1 py-2 text-sm font-medium text-warning-foreground underline hover:text-warning-foreground/80 cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  {t("dashboard.goToSettings")}
                </button>
              </div>
            </div>
          )}

          {/* Tax breakdown cards — only if profile is complete */}
          {!data.profileIncomplete && data.tax && data.inps && (
            <motion.div
              className="grid gap-4 md:grid-cols-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Imposta Sostitutiva card */}
              <motion.div variants={staggerItem}>
              <Card className="bg-success/5">
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
                    <span className="text-success-foreground">{formatEur(data.tax.impostaDovuta)}</span>
                  </div>
                </CardContent>
              </Card>
              </motion.div>

              {/* INPS Contributions card */}
              <motion.div variants={staggerItem}>
              <Card className="bg-info/5">
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
                    <span className="text-info-foreground">{formatEur(data.inps.totaleDovuto)}</span>
                  </div>
                </CardContent>
              </Card>
              </motion.div>

              {/* Net Position card */}
              <motion.div variants={staggerItem}>
              <Card className="bg-warning/5">
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
                    <span className="text-success-foreground">
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
              </motion.div>
            </motion.div>
          )}

          {/* F24 Payment Schedule */}
          {!data.profileIncomplete && data.payments && data.payments.length > 0 && (
            <motion.div variants={fadeSlideUp} initial="initial" animate="animate">
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
            </motion.div>
          )}

          {/* Simulator link */}
          <div className="text-center">
            <Link
              to="/taxes/simulator"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              data-testid="link-simulator"
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

const PaymentRow = React.memo(function PaymentRow({ payment, anno, recordPayment, t }: PaymentRowProps) {
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

      {/* Center: amount + breakdown + status */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-mono font-medium">{formatEur(payment.amountDue)}</p>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{t("taxes.imposta")}: {formatEur(payment.amountDueImposta)}</span>
            <span>{t("taxes.inps")}: {formatEur(payment.amountDueInps)}</span>
          </div>
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
                  <Button
                    onClick={handleConfirm}
                    loading={recordPayment.isPending}
                  >
                    {t("common.confirm")}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
});
