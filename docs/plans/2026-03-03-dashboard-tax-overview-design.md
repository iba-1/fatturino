# Dashboard + Tax Overview — Design

## Problem

The dashboard shows 4 stub cards with `--` placeholders. Users have no visibility into their revenue, tax obligations, or payment schedule. The tax engine exists in `@fatturino/shared` but isn't exposed in the UI.

## Decisions

| Decision | Choice |
|----------|--------|
| Data source | On-the-fly from invoices + profile (no persisted tax_periods) |
| API pattern | Single `GET /api/dashboard/summary?anno=2026` endpoint |
| Charts | shadcn/ui Charts (Recharts wrapper) |
| INPS gestione | New `gestioneInps` field on user_profiles (default: `separata`) |
| Year selector | Dropdown in dashboard header, defaults to current year |

## Design

### 1. API Endpoint

**`GET /api/dashboard/summary?anno=2026`** (authenticated)

Response shape:

```typescript
{
  anno: number;

  // Summary cards
  totalRevenue: number;       // sum totaleDocumento for non-draft invoices
  invoicesSent: number;       // count non-draft invoices
  pendingInvoices: number;    // count bozza invoices

  // Monthly chart data
  monthlyRevenue: Array<{ month: number; revenue: number }>;  // 12 entries, 0-filled

  // Tax estimates (null if profile incomplete)
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

  // Recent invoices
  recentInvoices: Array<{
    id: string;
    numeroFattura: number;
    dataEmissione: string;
    clientName: string;
    totaleDocumento: number;
    stato: string;
  }>;

  // Warnings
  profileIncomplete: boolean;
}
```

Logic:
- Queries invoices for the given year, grouped by month
- Reads user profile for codiceAteco, annoInizioAttivita, gestioneInps
- Calls `calcolaImposta()`, `calcolaInps()`, `calcolaAccontoSaldo()` from `@fatturino/shared`
- INPS `contributiInpsVersati` defaults to 0 (on-the-fly, no manual input)
- If profile missing codiceAteco or annoInizioAttivita, tax/inps/f24 = null + profileIncomplete = true

### 2. Schema Migration

Add `gestioneInps` to `user_profiles`:

```sql
ALTER TABLE user_profiles ADD COLUMN gestione_inps gestione_inps NOT NULL DEFAULT 'separata';
```

Uses existing `gestione_inps` enum. Also add to ProfileForm in Settings page.

### 3. Frontend Layout

**Row 1 — Summary Cards (4 cards):**
- Total Revenue (euro icon)
- Invoices Sent (send icon)
- Pending Invoices (clock icon)
- Tax Due (calculator icon)

**Row 2 — Monthly Revenue Bar Chart:**
- shadcn/ui `<ChartContainer>` + Recharts `<BarChart>`
- 12 bars (Jan–Dec), labeled by month abbreviation
- Tooltip showing exact amount on hover

**Row 3 — Tax Breakdown (3 cards side by side):**
- **Imposta Sostitutiva** — aliquota badge (5%/15%), reddito lordo, reddito imponibile, imposta dovuta
- **INPS Contributions** — gestione type, contributo fisso, eccedenza, totale
- **F24 Schedule** — 3 rows: primo acconto (Jun 30), secondo acconto (Nov 30), saldo (Jun 30 next year)

**Row 4 — Recent Invoices Table:**
- Last 5 invoices: number, date, client, amount, status badge
- Link to invoice detail

**Header:**
- Year selector dropdown (current year default)
- Missing profile warning banner if profileIncomplete

### 4. Hook

`useDashboardSummary(anno: number)` — TanStack Query hook calling the summary endpoint.

### 5. i18n

Add dashboard keys to `en.json` and `it.json`:
- Card titles, tax labels, month names, F24 deadline labels, warning messages

### 6. Testing

- **Unit:** Dashboard summary endpoint — mock invoices, verify revenue aggregation, monthly grouping, tax calculation pass-through
- **Unit:** Edge cases — no invoices (all zeros), incomplete profile (null tax fields)
- **E2E:** Dashboard loads with real data after creating profile + invoices, chart renders, tax section shows values
