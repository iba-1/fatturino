import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { useDashboardSummary } from "@/hooks/use-dashboard";

const formatEur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("dashboard.year")}:</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={anno}
            onChange={(e) => setAnno(parseInt(e.target.value, 10))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Profile warning */}
      {data?.profileIncomplete && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm dark:border-yellow-700 dark:bg-yellow-950">
          <p>{t("dashboard.profileWarning")}</p>
          <button
            className="mt-1 text-sm font-medium underline"
            onClick={() => navigate("/settings")}
          >
            {t("dashboard.goToSettings")}
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title={t("dashboard.totalRevenue")}
          value={isLoading ? "..." : formatEur(data?.totalRevenue ?? 0)}
        />
        <DashboardCard
          title={t("dashboard.invoicesSent")}
          value={isLoading ? "..." : String(data?.invoicesSent ?? 0)}
        />
        <DashboardCard
          title={t("dashboard.pendingInvoices")}
          value={isLoading ? "..." : String(data?.pendingInvoices ?? 0)}
        />
        <DashboardCard
          title={t("dashboard.taxDue")}
          value={isLoading ? "..." : data?.tax ? formatEur(data.tax.impostaDovuta) : "\u2014"}
        />
      </div>

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
        <div className="grid gap-4 md:grid-cols-3">
          {/* Imposta Sostitutiva */}
          <Card>
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

          {/* INPS */}
          <Card>
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
                  <span className="text-muted-foreground">Contributo fisso</span>
                  <span>{formatEur(data.inps!.contributoFisso)}</span>
                </div>
              )}
              {data.inps!.contributoEccedenza > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eccedenza</span>
                  <span>{formatEur(data.inps!.contributoEccedenza)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>{t("taxes.inpsContributions")}</span>
                <span>{formatEur(data.inps!.totaleDovuto)}</span>
              </div>
            </CardContent>
          </Card>

          {/* F24 Schedule */}
          <Card>
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
        </div>
      )}

      {/* Recent invoices table */}
      {data && data.recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">#</th>
                  <th className="pb-2">{t("invoices.date")}</th>
                  <th className="pb-2">{t("invoices.client")}</th>
                  <th className="pb-2 text-right">{t("invoices.amount")}</th>
                  <th className="pb-2">{t("invoices.status")}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="py-2">{inv.numeroFattura}</td>
                    <td className="py-2">
                      {new Date(inv.dataEmissione).toLocaleDateString("it-IT")}
                    </td>
                    <td className="py-2">{inv.clientName}</td>
                    <td className="py-2 text-right">{formatEur(inv.totaleDocumento)}</td>
                    <td className="py-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">
                        {inv.stato}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
