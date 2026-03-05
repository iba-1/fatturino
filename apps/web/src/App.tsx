import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Invoices } from "@/pages/Invoices";
import { InvoiceEditor } from "@/pages/InvoiceEditor";
import { InvoiceDetail } from "@/pages/InvoiceDetail";
import { Clients } from "@/pages/Clients";
import { Taxes } from "@/pages/Taxes";
import { TaxSimulator } from "@/pages/TaxSimulator";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "invoices", element: <Invoices /> },
          { path: "invoices/new", element: <InvoiceEditor /> },
          { path: "invoices/:id", element: <InvoiceDetail /> },
          { path: "invoices/:id/edit", element: <InvoiceEditor /> },
          { path: "clients", element: <Clients /> },
          { path: "taxes", element: <Taxes /> },
          { path: "taxes/simulator", element: <TaxSimulator /> },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
