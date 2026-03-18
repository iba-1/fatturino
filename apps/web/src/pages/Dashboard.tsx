import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Send, Clock, Wallet, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { CountUp } from "@/components/CountUp";
import { formatEur } from "@/lib/format";

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const currentYear = new Date().getFullYear();
  const [anno, setAnno] = useState(currentYear);

  const { data, isLoading } = useDashboardSummary(anno);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const chartConfig = {
    revenue: { label: t("dashboard.totalRevenue"), color: "hsl(var(--chart-1))" },
  };

  const chartData = data?.monthlyRevenue.map((m) => ({
    month: (t("dashboard.months", { returnObjects: true }) as string[])[m.month - 1],
    revenue: m.revenue,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header with year selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("dashboard.year")}:</span>
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

      {/* Profile warning */}
      {data?.profileIncomplete && (
        <div role="alert" className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm flex items-start gap-3" data-testid="profile-warning">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/40">
            <Calculator className="h-4 w-4 text-warning-foreground" />
          </div>
          <div>
            <p className="text-warning-foreground">{t("dashboard.profileWarning")}</p>
            <button type="button" className="mt-1 py-2 text-sm font-medium text-warning-foreground underline hover:text-warning-foreground/80 cursor-pointer" onClick={() => navigate("/settings")}>
              {t("dashboard.goToSettings")}
            </button>
          </div>
        </div>
      )}

      {/* Bento grid: hero + stat cards */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
            data-testid="summary-cards"
          >
            <Skeleton className="h-[240px] rounded-xl md:col-span-2 lg:row-span-2" />
            <Skeleton className="h-[106px] rounded-xl" />
            <Skeleton className="h-[106px] rounded-xl" />
            <Skeleton className="h-[106px] rounded-xl" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            data-testid="summary-cards"
          >
            {/* Hero revenue card — 2 cols, 2 rows on desktop */}
            <motion.div variants={staggerItem} className="md:col-span-2 lg:row-span-2">
              <HeroRevenueCard
                totalRevenue={data?.totalRevenue ?? 0}
                chartData={chartData}
                chartConfig={chartConfig}
                year={anno}
                t={t}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <DashboardCard
                title={t("dashboard.invoicesSent")}
                value={String(data?.invoicesSent ?? 0)}
                icon={Send}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <DashboardCard
                title={t("dashboard.pendingInvoices")}
                value={String(data?.pendingInvoices ?? 0)}
                icon={Clock}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <DashboardCard
                title={t("dashboard.netIncome")}
                value={data?.tax && data?.inps
                  ? formatEur(data.totalRevenue - data.inps.totaleDovuto - data.tax.impostaDovuta)
                  : "\u2014"}
                icon={Wallet}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monthly revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.monthlyRevenue")}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `\u20AC${v}`} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-8 text-center text-muted-foreground">{t("dashboard.noInvoices")}</p>
          )}
        </CardContent>
      </Card>

      {/* Tax breakdown */}
      {data && !data.profileIncomplete && (
        <motion.div
          className="grid gap-4 md:grid-cols-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Imposta Sostitutiva */}
          <motion.div variants={staggerItem}>
            <Card className="bg-success/5">
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.impostaSostitutiva")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("taxes.profitabilityCoeff")}</span>
                  <span>{data.tax!.coefficienteRedditivita}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("taxes.grossIncome")}</span>
                  <span>{formatEur(data.tax!.redditoLordo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("taxes.taxableIncome")}</span>
                  <span>{formatEur(data.tax!.redditoImponibile)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("taxes.taxRate")}</span>
                  <span className="inline-flex items-center gap-1">
                    {data.tax!.aliquota}%
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {data.tax!.isStartup ? t("dashboard.startup") : t("dashboard.ordinary")}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>{t("taxes.taxDue")}</span>
                  <span>{formatEur(data.tax!.impostaDovuta)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* INPS */}
          <motion.div variants={staggerItem}>
            <Card className="bg-info/5">
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.inpsContributions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("settings.inpsManagement")}</span>
                  <span className="capitalize">{data.inps!.gestione}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("taxes.taxableIncome")}</span>
                  <span>{formatEur(data.inps!.baseImponibile)}</span>
                </div>
                {data.inps!.contributoFisso > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("dashboard.contributoFisso")}</span>
                    <span>{formatEur(data.inps!.contributoFisso)}</span>
                  </div>
                )}
                {data.inps!.contributoEccedenza > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("dashboard.eccedenza")}</span>
                    <span>{formatEur(data.inps!.contributoEccedenza)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>{t("taxes.inpsContributions")}</span>
                  <span>{formatEur(data.inps!.totaleDovuto)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* F24 Schedule */}
          <motion.div variants={staggerItem}>
            <Card className="bg-warning/5">
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.f24Schedule")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("dashboard.primoAcconto")}</span>
                  <span>{formatEur(data.f24!.primoAcconto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("dashboard.secondoAcconto")}</span>
                  <span>{formatEur(data.f24!.secondoAcconto)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>{t("dashboard.saldo")}</span>
                  <span>{formatEur(data.f24!.saldo)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Recent invoices table */}
      {data && data.recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 text-xs font-medium uppercase tracking-wider">#</th>
                  <th className="pb-2 text-xs font-medium uppercase tracking-wider">{t("invoices.date")}</th>
                  <th className="pb-2 text-xs font-medium uppercase tracking-wider">{t("invoices.client")}</th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider">{t("invoices.amount")}</th>
                  <th className="pb-2 text-xs font-medium uppercase tracking-wider">{t("invoices.status")}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer border-b last:border-0 transition-colors duration-200 hover:bg-muted/50"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    tabIndex={0}
                    role="link"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/invoices/${inv.id}`); } }}
                  >
                    <td className="py-2">{inv.numeroFattura}</td>
                    <td className="py-2">
                      {new Date(inv.dataEmissione).toLocaleDateString("it-IT")}
                    </td>
                    <td className="py-2">{inv.clientName}</td>
                    <td className="py-2 text-right font-mono">{formatEur(inv.totaleDocumento)}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium capitalize text-primary-foreground">
                        {inv.stato}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const HeroRevenueCard = React.memo(function HeroRevenueCard({
  totalRevenue,
  chartData,
  chartConfig,
  year,
  t,
}: {
  totalRevenue: number;
  chartData: Array<{ month: string; revenue: number }>;
  chartConfig: Record<string, { label: string; color: string }>;
  year: number;
  t: (key: string) => string;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border bg-card p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t("dashboard.totalRevenue")} {year}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight font-mono">
          <CountUp end={totalRevenue} formatter={formatEur} />
        </p>
      </div>
      {chartData.length > 0 && (
        <div className="mt-4">
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <BarChart data={chartData}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
});

const DashboardCard = React.memo(function DashboardCard({
  title, value, icon: Icon,
}: {
  title: string; value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <p className="text-sm font-medium">{title}</p>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight font-mono">{value}</p>
      </CardContent>
    </Card>
  );
});
