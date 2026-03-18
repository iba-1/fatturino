import React, { Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FullPageLoader } from "@/components/FullPageLoader";

// Route-level code splitting
const Dashboard = React.lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Invoices = React.lazy(() => import("@/pages/Invoices").then(m => ({ default: m.Invoices })));
const InvoiceEditor = React.lazy(() => import("@/pages/InvoiceEditor").then(m => ({ default: m.InvoiceEditor })));
const InvoiceDetail = React.lazy(() => import("@/pages/InvoiceDetail").then(m => ({ default: m.InvoiceDetail })));
const Clients = React.lazy(() => import("@/pages/Clients").then(m => ({ default: m.Clients })));
const Taxes = React.lazy(() => import("@/pages/Taxes").then(m => ({ default: m.Taxes })));
const TaxSimulator = React.lazy(() => import("@/pages/TaxSimulator").then(m => ({ default: m.TaxSimulator })));
const Settings = React.lazy(() => import("@/pages/Settings").then(m => ({ default: m.Settings })));
const Login = React.lazy(() => import("@/pages/Login").then(m => ({ default: m.Login })));
const Register = React.lazy(() => import("@/pages/Register").then(m => ({ default: m.Register })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<FullPageLoader />}>{children}</Suspense>
);

const router = createBrowserRouter([
  { path: "/login", element: <SuspenseWrapper><Login /></SuspenseWrapper> },
  { path: "/register", element: <SuspenseWrapper><Register /></SuspenseWrapper> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <SuspenseWrapper><Dashboard /></SuspenseWrapper> },
          { path: "invoices", element: <SuspenseWrapper><Invoices /></SuspenseWrapper> },
          { path: "invoices/new", element: <SuspenseWrapper><InvoiceEditor /></SuspenseWrapper> },
          { path: "invoices/:id", element: <SuspenseWrapper><InvoiceDetail /></SuspenseWrapper> },
          { path: "invoices/:id/edit", element: <SuspenseWrapper><InvoiceEditor /></SuspenseWrapper> },
          { path: "clients", element: <SuspenseWrapper><Clients /></SuspenseWrapper> },
          { path: "taxes", element: <SuspenseWrapper><Taxes /></SuspenseWrapper> },
          { path: "taxes/simulator", element: <SuspenseWrapper><TaxSimulator /></SuspenseWrapper> },
          { path: "settings", element: <SuspenseWrapper><Settings /></SuspenseWrapper> },
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
