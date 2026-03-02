import { useTranslation } from "react-i18next";

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title={t("dashboard.totalRevenue")}
          value="--"
        />
        <DashboardCard
          title={t("dashboard.invoicesSent")}
          value="--"
        />
        <DashboardCard
          title={t("dashboard.pendingInvoices")}
          value="--"
        />
        <DashboardCard
          title={t("dashboard.taxDue")}
          value="--"
        />
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
