import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calculator,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/lib/auth";

const navItems = [
  { path: "/", key: "nav.dashboard", icon: LayoutDashboard },
  { path: "/invoices", key: "nav.invoices", icon: FileText },
  { path: "/clients", key: "nav.clients", icon: Users },
  { path: "/taxes", key: "nav.taxes", icon: Calculator },
  { path: "/settings", key: "nav.settings", icon: Settings },
] as const;

export function Layout() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
          Fatturino
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ path, key, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            viewTransition
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-sidebar-active text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-active/50 hover:text-sidebar-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {t(key)}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors duration-200 hover:bg-sidebar-active/50 hover:text-sidebar-foreground cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-col border-r border-sidebar-border bg-sidebar-bg transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-1 text-sidebar-muted hover:bg-sidebar-active/50 hover:text-sidebar-foreground lg:hidden cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:ml-[var(--sidebar-width)]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center bg-sidebar-bg px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-active/50 hover:text-sidebar-foreground cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-semibold text-sidebar-foreground">Fatturino</span>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
