import { useTranslation } from "react-i18next";
import { Calculator } from "lucide-react";

export function Taxes() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
      <Calculator className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h1 className="mt-4 text-lg font-medium">{t("taxes.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tax calculations will be available here soon.</p>
    </div>
  );
}
