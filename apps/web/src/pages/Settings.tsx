import { useTranslation } from "react-i18next";

export function Settings() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
      <div className="mt-6">
        <p className="text-muted-foreground">Phase 2 — Settings will be implemented here.</p>
      </div>
    </div>
  );
}
