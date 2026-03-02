import { useTranslation } from "react-i18next";

export function Taxes() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("taxes.title")}</h1>
      <div className="mt-6">
        <p className="text-muted-foreground">Phase 4 — Tax calculations will be implemented here.</p>
      </div>
    </div>
  );
}
