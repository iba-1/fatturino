import { useTranslation } from "react-i18next";

export function Invoices() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("invoices.title")}</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {t("invoices.new")}
        </button>
      </div>
      <div className="mt-6">
        <p className="text-muted-foreground">Phase 2 — Invoice list will be implemented here.</p>
      </div>
    </div>
  );
}
