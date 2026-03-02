import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

const navItems = [
  { path: "/", key: "nav.dashboard" },
  { path: "/invoices", key: "nav.invoices" },
  { path: "/clients", key: "nav.clients" },
  { path: "/taxes", key: "nav.taxes" },
  { path: "/settings", key: "nav.settings" },
] as const;

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            {t("common.appName")}
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
