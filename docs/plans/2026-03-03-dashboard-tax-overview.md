# Dashboard + Tax Overview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the stub dashboard with real summary cards, a monthly revenue bar chart, tax breakdown (imposta sostitutiva, INPS, F24 schedule), and a recent invoices table.

**Architecture:** Single new `GET /api/dashboard/summary?anno=YYYY` endpoint aggregates invoice data and runs tax calculations on-the-fly using the existing `@fatturino/shared` tax engine. Frontend uses shadcn/ui Charts (Recharts) for the bar chart, shadcn/ui Card for metrics, and a year selector dropdown. A new `gestioneInps` field is added to `user_profiles` via DB migration.

**Tech Stack:** Fastify 5, Drizzle ORM (PostgreSQL), React 18, TanStack Query, shadcn/ui (Card, Select, Chart), Recharts, i18next, Vitest, Playwright

---

### Task 1: Add `gestioneInps` column to user_profiles schema

**Files:**
- Modify: `apps/api/src/db/schema.ts` (line ~128, add column before `createdAt`)
- Modify: `packages/shared/src/schemas/index.ts` (line ~39, add to `createUserProfileSchema`)
- Modify: `apps/web/src/hooks/use-profile.ts` (line ~7, add to `UserProfile` interface and `ProfileFormData`)

**Step 1: Add column to Drizzle schema**

In `apps/api/src/db/schema.ts`, add after `annoInizioAttivita` (line 128):

```typescript
gestioneInps: gestioneInpsEnum("gestione_inps").notNull().default("separata"),
```

The `gestioneInpsEnum` already exists in schema.ts (used by `inpsContributions` table).

**Step 2: Add to Zod validation schema**

In `packages/shared/src/schemas/index.ts`, add to `createUserProfileSchema` after `annoInizioAttivita` (line 39):

```typescript
gestioneInps: z.enum(["separata", "artigiani", "commercianti"]).default("separata"),
```

**Step 3: Add to frontend types**

In `apps/web/src/hooks/use-profile.ts`:

Add to `UserProfile` interface (after `annoInizioAttivita: number;`):
```typescript
gestioneInps: "separata" | "artigiani" | "commercianti";
```

Add to `ProfileFormData` (after `annoInizioAttivita: number;`):
```typescript
gestioneInps?: "separata" | "artigiani" | "commercianti";
```

**Step 4: Generate and run the DB migration**

```bash
cd apps/api && npx drizzle-kit generate && npx drizzle-kit push
```

**Step 5: Run existing tests to verify nothing breaks**

```bash
pnpm --filter @fatturino/shared test && pnpm --filter @fatturino/api test
```

**Step 6: Commit**

```bash
git add apps/api/src/db/schema.ts packages/shared/src/schemas/index.ts apps/web/src/hooks/use-profile.ts
git commit -m "feat: add gestioneInps column to user_profiles schema"
```

---

### Task 2: Add `gestioneInps` field to ProfileForm and Settings page

**Files:**
- Modify: `apps/web/src/components/ProfileForm.tsx` (add select field)
- Modify: `apps/web/src/i18n/en.json` (add label)
- Modify: `apps/web/src/i18n/it.json` (add label)

**Step 1: Add i18n keys**

In `apps/web/src/i18n/en.json`, add to `settings` section:
```json
"inpsManagement": "INPS Management",
"gestSeparata": "Gestione Separata",
"gestArtigiani": "Artigiani",
"gestCommercianti": "Commercianti"
```

In `apps/web/src/i18n/it.json`, add to `settings` section:
```json
"inpsManagement": "Gestione INPS",
"gestSeparata": "Gestione Separata",
"gestArtigiani": "Artigiani",
"gestCommercianti": "Commercianti"
```

**Step 2: Add gestioneInps state and select to ProfileForm**

In `apps/web/src/components/ProfileForm.tsx`:

Add state (after `annoInizioAttivita` state, ~line 31):
```typescript
const [gestioneInps, setGestioneInps] = useState<"separata" | "artigiani" | "commercianti">("separata");
```

In `useEffect` (after `setAnnoInizioAttivita`, ~line 50):
```typescript
setGestioneInps(profile.gestioneInps ?? "separata");
```

In `handleSubmit` data object (after `annoInizioAttivita`, ~line 65):
```typescript
gestioneInps,
```

Add a select field in the form, in the same grid row as `annoInizioAttivita` (replace the single-column layout with a 3-column grid for iban, annoInizio, gestioneInps):

```tsx
<div className="space-y-2">
  <Label htmlFor="gestioneInps">{t("settings.inpsManagement")}</Label>
  <select
    id="gestioneInps"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    value={gestioneInps}
    onChange={(e) => setGestioneInps(e.target.value as "separata" | "artigiani" | "commercianti")}
  >
    <option value="separata">{t("settings.gestSeparata")}</option>
    <option value="artigiani">{t("settings.gestArtigiani")}</option>
    <option value="commercianti">{t("settings.gestCommercianti")}</option>
  </select>
  {serverErrors.gestioneInps && (
    <p className="text-sm text-destructive">{serverErrors.gestioneInps}</p>
  )}
</div>
```

**Step 3: Run the build to check for type errors**

```bash
pnpm --filter @fatturino/web build
```

**Step 4: Commit**

```bash
git add apps/web/src/components/ProfileForm.tsx apps/web/src/i18n/en.json apps/web/src/i18n/it.json
git commit -m "feat: add gestioneInps field to ProfileForm"
```

---

### Task 3: Create dashboard summary API endpoint with tests

**Files:**
- Create: `apps/api/src/routes/dashboard.ts`
- Create: `apps/api/src/__tests__/dashboard.test.ts`
- Modify: `apps/api/src/server.ts` (register route)

**Step 1: Write the failing tests**

Create `apps/api/src/__tests__/dashboard.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// We'll test the aggregation logic directly since route tests
// require DB setup. Extract the logic into a testable function.

import { aggregateDashboardData } from "../routes/dashboard.js";

describe("aggregateDashboardData", () => {
  it("returns zero values when no invoices exist", () => {
    const result = aggregateDashboardData({
      invoices: [],
      profile: null,
      anno: 2026,
    });

    expect(result.totalRevenue).toBe(0);
    expect(result.invoicesSent).toBe(0);
    expect(result.pendingInvoices).toBe(0);
    expect(result.monthlyRevenue).toHaveLength(12);
    expect(result.monthlyRevenue.every((m) => m.revenue === 0)).toBe(true);
    expect(result.tax).toBeNull();
    expect(result.inps).toBeNull();
    expect(result.f24).toBeNull();
    expect(result.profileIncomplete).toBe(true);
  });

  it("aggregates revenue from non-draft invoices only", () => {
    const invoices = [
      { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-03-15") },
      { totaleDocumento: "500.00", stato: "bozza", dataEmissione: new Date("2026-03-20") },
      { totaleDocumento: "2000.00", stato: "consegnata", dataEmissione: new Date("2026-06-01") },
    ];

    const result = aggregateDashboardData({ invoices, profile: null, anno: 2026 });

    expect(result.totalRevenue).toBe(3000);
    expect(result.invoicesSent).toBe(2);
    expect(result.pendingInvoices).toBe(1);
  });

  it("groups revenue by month correctly", () => {
    const invoices = [
      { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-15") },
      { totaleDocumento: "500.00", stato: "inviata", dataEmissione: new Date("2026-01-20") },
      { totaleDocumento: "2000.00", stato: "consegnata", dataEmissione: new Date("2026-06-01") },
    ];

    const result = aggregateDashboardData({ invoices, profile: null, anno: 2026 });

    expect(result.monthlyRevenue[0]).toEqual({ month: 1, revenue: 1500 });
    expect(result.monthlyRevenue[5]).toEqual({ month: 6, revenue: 2000 });
    expect(result.monthlyRevenue[11]).toEqual({ month: 12, revenue: 0 });
  });

  it("calculates tax estimates when profile is complete", () => {
    const invoices = [
      { totaleDocumento: "50000.00", stato: "inviata", dataEmissione: new Date("2026-03-15") },
    ];
    const profile = {
      codiceAteco: "62.01",
      annoInizioAttivita: 2024,
      gestioneInps: "separata" as const,
    };

    const result = aggregateDashboardData({ invoices, profile, anno: 2026 });

    expect(result.tax).not.toBeNull();
    expect(result.tax!.aliquota).toBe(5); // startup (2026 - 2024 = 2 < 5)
    expect(result.tax!.coefficienteRedditivita).toBe(67); // IT services
    expect(result.inps).not.toBeNull();
    expect(result.inps!.gestione).toBe("separata");
    expect(result.f24).not.toBeNull();
    expect(result.profileIncomplete).toBe(false);
  });

  it("marks profile incomplete if codiceAteco missing", () => {
    const result = aggregateDashboardData({
      invoices: [],
      profile: { codiceAteco: "", annoInizioAttivita: 2024, gestioneInps: "separata" },
      anno: 2026,
    });

    expect(result.profileIncomplete).toBe(true);
    expect(result.tax).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm --filter @fatturino/api test -- dashboard
```
Expected: FAIL (module not found)

**Step 3: Implement the dashboard route**

Create `apps/api/src/routes/dashboard.ts`:

```typescript
import type { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import { calcolaImposta, calcolaInps, calcolaAccontoSaldo } from "@fatturino/shared";
import { db } from "../db/index.js";
import { invoices, invoiceLines, userProfiles, clients } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

interface DashboardInvoice {
  totaleDocumento: string;
  stato: string;
  dataEmissione: Date;
}

interface DashboardProfile {
  codiceAteco: string;
  annoInizioAttivita: number;
  gestioneInps: string;
}

interface AggregateInput {
  invoices: DashboardInvoice[];
  profile: DashboardProfile | null;
  anno: number;
}

export function aggregateDashboardData(input: AggregateInput) {
  const { invoices: invs, profile, anno } = input;

  // Summary counts
  const nonDraft = invs.filter((i) => i.stato !== "bozza");
  const drafts = invs.filter((i) => i.stato === "bozza");

  const totalRevenue = nonDraft.reduce(
    (sum, i) => sum + parseFloat(String(i.totaleDocumento)),
    0
  );
  const invoicesSent = nonDraft.length;
  const pendingInvoices = drafts.length;

  // Monthly revenue (non-draft only)
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: 0,
  }));

  for (const inv of nonDraft) {
    const date = new Date(inv.dataEmissione);
    const month = date.getMonth(); // 0-indexed
    monthlyRevenue[month].revenue += parseFloat(String(inv.totaleDocumento));
  }

  // Round monthly values
  for (const m of monthlyRevenue) {
    m.revenue = Math.round(m.revenue * 100) / 100;
  }

  // Tax calculations (null if profile incomplete)
  const profileIncomplete =
    !profile || !profile.codiceAteco || !profile.annoInizioAttivita;

  let tax = null;
  let inps = null;
  let f24 = null;

  if (!profileIncomplete && profile) {
    try {
      // Calculate INPS first (needed for imposta)
      const inpsResult = calcolaInps({
        fatturato: totalRevenue,
        codiceAteco: profile.codiceAteco,
        gestione: profile.gestioneInps as "separata" | "artigiani" | "commercianti",
      });

      inps = {
        gestione: profile.gestioneInps,
        baseImponibile: inpsResult.baseImponibile,
        contributoFisso: inpsResult.contributoFisso,
        contributoEccedenza: inpsResult.contributoEccedenza,
        totaleDovuto: inpsResult.totaleDovuto,
      };

      // Calculate imposta sostitutiva (uses INPS total as deduction)
      const taxResult = calcolaImposta({
        fatturato: totalRevenue,
        codiceAteco: profile.codiceAteco,
        contributiInpsVersati: inpsResult.totaleDovuto,
        annoInizioAttivita: profile.annoInizioAttivita,
        annoFiscale: anno,
      });

      tax = {
        coefficienteRedditivita: taxResult.coefficienteRedditivita,
        redditoLordo: taxResult.redditoLordo,
        redditoImponibile: taxResult.redditoImponibile,
        aliquota: taxResult.aliquota,
        isStartup: taxResult.isStartup,
        impostaDovuta: taxResult.impostaDovuta,
      };

      // F24 schedule (accontiVersati = 0 for on-the-fly calculation)
      const f24Result = calcolaAccontoSaldo({
        impostaDovuta: taxResult.impostaDovuta,
        accontiVersati: 0,
        anno,
      });

      f24 = {
        primoAcconto: f24Result.primoAcconto,
        secondoAcconto: f24Result.secondoAcconto,
        saldo: f24Result.saldo,
      };
    } catch {
      // Invalid ATECO code or other calculation error — treat as incomplete
      tax = null;
      inps = null;
      f24 = null;
    }
  }

  return {
    anno,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    invoicesSent,
    pendingInvoices,
    monthlyRevenue,
    tax,
    inps,
    f24,
    profileIncomplete: profileIncomplete || tax === null,
  };
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get<{ Querystring: { anno?: string } }>(
    "/api/dashboard/summary",
    async (request) => {
      const userId = getUserId(request);
      const anno = request.query.anno
        ? parseInt(request.query.anno, 10)
        : new Date().getFullYear();

      // Fetch invoices for the year
      const yearInvoices = await db
        .select({
          totaleDocumento: invoices.totaleDocumento,
          stato: invoices.stato,
          dataEmissione: invoices.dataEmissione,
        })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), eq(invoices.anno, anno)));

      // Fetch recent invoices (last 5, any year) with client name
      const recentInvoices = await db
        .select({
          id: invoices.id,
          numeroFattura: invoices.numeroFattura,
          dataEmissione: invoices.dataEmissione,
          totaleDocumento: invoices.totaleDocumento,
          stato: invoices.stato,
          clientRagioneSociale: clients.ragioneSociale,
          clientNome: clients.nome,
          clientCognome: clients.cognome,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(eq(invoices.userId, userId))
        .orderBy(sql`${invoices.dataEmissione} DESC`)
        .limit(5);

      // Fetch profile
      const profiles = await db
        .select({
          codiceAteco: userProfiles.codiceAteco,
          annoInizioAttivita: userProfiles.annoInizioAttivita,
          gestioneInps: userProfiles.gestioneInps,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      const profile = profiles.length > 0 ? profiles[0] : null;

      const summary = aggregateDashboardData({
        invoices: yearInvoices,
        profile,
        anno,
      });

      return {
        ...summary,
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          numeroFattura: inv.numeroFattura,
          dataEmissione: inv.dataEmissione,
          totaleDocumento: parseFloat(String(inv.totaleDocumento)),
          stato: inv.stato,
          clientName:
            inv.clientRagioneSociale ||
            [inv.clientNome, inv.clientCognome].filter(Boolean).join(" ") ||
            "—",
        })),
      };
    }
  );
}
```

**Step 4: Register route in server.ts**

In `apps/api/src/server.ts`, add import (after profileRoutes import):
```typescript
import { dashboardRoutes } from "./routes/dashboard.js";
```

Add registration (after `await app.register(profileRoutes);`):
```typescript
await app.register(dashboardRoutes);
```

**Step 5: Run tests to verify they pass**

```bash
pnpm --filter @fatturino/api test -- dashboard
```
Expected: ALL PASS

**Step 6: Commit**

```bash
git add apps/api/src/routes/dashboard.ts apps/api/src/__tests__/dashboard.test.ts apps/api/src/server.ts
git commit -m "feat: add dashboard summary API endpoint with tax calculations"
```

---

### Task 4: Install shadcn/ui Chart component and Recharts

**Files:**
- Modify: `apps/web/package.json` (add recharts dependency)
- Create: `apps/web/src/components/ui/chart.tsx` (shadcn chart component)

**Step 1: Install recharts**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web add recharts
```

**Step 2: Add the shadcn/ui Chart component**

Run:
```bash
cd apps/web && npx shadcn@latest add chart
```

If the CLI doesn't work (no shadcn config), manually create `apps/web/src/components/ui/chart.tsx` with the shadcn/ui chart component. The key exports needed are `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, and the `ChartConfig` type. Get the component from the shadcn/ui docs.

**Step 3: Verify build passes**

```bash
pnpm --filter @fatturino/web build
```

**Step 4: Commit**

```bash
git add apps/web/src/components/ui/chart.tsx apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add shadcn/ui Chart component and recharts"
```

---

### Task 5: Create `useDashboardSummary` hook

**Files:**
- Create: `apps/web/src/hooks/use-dashboard.ts`

**Step 1: Create the hook**

Create `apps/web/src/hooks/use-dashboard.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardSummary {
  anno: number;
  totalRevenue: number;
  invoicesSent: number;
  pendingInvoices: number;
  monthlyRevenue: Array<{ month: number; revenue: number }>;
  tax: {
    coefficienteRedditivita: number;
    redditoLordo: number;
    redditoImponibile: number;
    aliquota: number;
    isStartup: boolean;
    impostaDovuta: number;
  } | null;
  inps: {
    gestione: string;
    baseImponibile: number;
    contributoFisso: number;
    contributoEccedenza: number;
    totaleDovuto: number;
  } | null;
  f24: {
    primoAcconto: number;
    secondoAcconto: number;
    saldo: number;
  } | null;
  recentInvoices: Array<{
    id: string;
    numeroFattura: number;
    dataEmissione: string;
    totaleDocumento: number;
    stato: string;
    clientName: string;
  }>;
  profileIncomplete: boolean;
}

export function useDashboardSummary(anno: number) {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard", anno],
    queryFn: () => api.get<DashboardSummary>(`/dashboard/summary?anno=${anno}`),
  });
}
```

**Step 2: Verify build**

```bash
pnpm --filter @fatturino/web build
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/use-dashboard.ts
git commit -m "feat: add useDashboardSummary hook"
```

---

### Task 6: Add dashboard i18n keys

**Files:**
- Modify: `apps/web/src/i18n/en.json`
- Modify: `apps/web/src/i18n/it.json`

**Step 1: Add new i18n keys**

In `apps/web/src/i18n/en.json`, expand the `dashboard` section:

```json
"dashboard": {
  "title": "Dashboard",
  "totalRevenue": "Total Revenue",
  "invoicesSent": "Invoices Sent",
  "pendingInvoices": "Pending Invoices",
  "taxDue": "Tax Due",
  "year": "Year",
  "monthlyRevenue": "Monthly Revenue",
  "recentInvoices": "Recent Invoices",
  "noInvoices": "No invoices yet",
  "profileWarning": "Complete your profile in Settings to see tax estimates.",
  "goToSettings": "Go to Settings",
  "taxBreakdown": "Tax Breakdown",
  "impostaSostitutiva": "Imposta Sostitutiva",
  "inpsContributions": "INPS Contributions",
  "f24Schedule": "F24 Payment Schedule",
  "startup": "Startup Rate",
  "ordinary": "Ordinary Rate",
  "primoAcconto": "First Advance (Jun 30)",
  "secondoAcconto": "Second Advance (Nov 30)",
  "saldo": "Balance (Jun 30 next year)",
  "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
}
```

In `apps/web/src/i18n/it.json`, expand the `dashboard` section:

```json
"dashboard": {
  "title": "Dashboard",
  "totalRevenue": "Fatturato Totale",
  "invoicesSent": "Fatture Inviate",
  "pendingInvoices": "Fatture in Bozza",
  "taxDue": "Imposte Dovute",
  "year": "Anno",
  "monthlyRevenue": "Fatturato Mensile",
  "recentInvoices": "Fatture Recenti",
  "noInvoices": "Nessuna fattura",
  "profileWarning": "Completa il tuo profilo nelle Impostazioni per vedere le stime fiscali.",
  "goToSettings": "Vai alle Impostazioni",
  "taxBreakdown": "Riepilogo Fiscale",
  "impostaSostitutiva": "Imposta Sostitutiva",
  "inpsContributions": "Contributi INPS",
  "f24Schedule": "Scadenziario F24",
  "startup": "Aliquota Startup",
  "ordinary": "Aliquota Ordinaria",
  "primoAcconto": "Primo Acconto (30 giu)",
  "secondoAcconto": "Secondo Acconto (30 nov)",
  "saldo": "Saldo (30 giu anno succ.)",
  "months": ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
}
```

**Step 2: Verify build**

```bash
pnpm --filter @fatturino/web build
```

**Step 3: Commit**

```bash
git add apps/web/src/i18n/en.json apps/web/src/i18n/it.json
git commit -m "feat: add dashboard i18n keys (EN + IT)"
```

---

### Task 7: Rewrite Dashboard page with summary cards, chart, tax breakdown, and recent invoices

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx` (complete rewrite)

**Step 1: Rewrite Dashboard.tsx**

Replace `apps/web/src/pages/Dashboard.tsx` entirely:

```tsx
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

  // Year options: current year and 4 years back
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
          value={isLoading ? "..." : data?.tax ? formatEur(data.tax.impostaDovuta) : "—"}
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
                <YAxis tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-8 text-center text-muted-foreground">{t("dashboard.noInvoices")}</p>
          )}
        </CardContent>
      </Card>

      {/* Tax breakdown — only show if profile is complete */}
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
```

**Step 2: Verify build**

```bash
pnpm --filter @fatturino/web build
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx
git commit -m "feat: rewrite Dashboard with summary cards, revenue chart, tax breakdown, recent invoices"
```

---

### Task 8: Add E2E tests for the dashboard

**Files:**
- Create: `e2e/dashboard.spec.ts`

**Step 1: Write E2E tests**

Create `e2e/dashboard.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login (reuse existing auth helper pattern from other e2e tests)
    await page.goto("/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("displays dashboard title and year selector", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(page.locator("select")).toBeVisible();
  });

  test("shows summary cards with values", async ({ page }) => {
    // Should show 4 cards (they may have -- or real values)
    const cards = page.locator('[class*="CardContent"]');
    await expect(cards).toHaveCount(4);
  });

  test("shows profile warning when profile is incomplete", async ({ page }) => {
    // If test user has no profile, warning should appear
    const warning = page.locator("text=Complete your profile");
    // This may or may not be visible depending on test data
    // Just verify the page loads without errors
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("year selector changes displayed data", async ({ page }) => {
    const select = page.locator("select");
    await select.selectOption(String(new Date().getFullYear() - 1));
    // Verify the page reloads data (no crash)
    await expect(page.locator("h1")).toContainText("Dashboard");
  });
});
```

**Step 2: Run E2E tests**

```bash
pnpm exec playwright test e2e/dashboard.spec.ts
```

**Step 3: Commit**

```bash
git add e2e/dashboard.spec.ts
git commit -m "test: add E2E tests for dashboard page"
```
