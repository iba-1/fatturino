# Tax Page Design

## Goal

Build a dedicated tax overview page and tax simulator for forfettario freelancers, with F24 PDF generation and payment tracking.

## Routes

- **`/taxes`** — Yearly tax overview computed from real invoice data
- **`/taxes/simulator`** — What-if calculator with profile overrides

## Tax Overview (`/taxes`)

### Layout

1. **Header**: Year selector (same pattern as dashboard) + page title
2. **Profile warning banner**: Shown when profile is incomplete, links to `/settings`
3. **Summary cards** (3 cards in a row):
   - **Imposta Sostitutiva**: coefficiente di redditività, reddito lordo, INPS deduction, reddito imponibile, aliquota (5%/15% with startup badge), imposta dovuta
   - **INPS Contributions**: gestione type label, base imponibile, contributo fisso (artigiani/commercianti only), contributo eccedenza, totale dovuto
   - **Net Position**: total revenue, total taxes (imposta + INPS), net income, effective tax rate %
4. **F24 Payment Schedule** (3 deadline cards):
   - Primo Acconto (June 30) — codice tributo 1790
   - Secondo Acconto (November 30) — codice tributo 1791
   - Saldo (June 30 of following year) — codice tributo 1792
   - Each shows: amount due, status badge (pending/paid/overdue), "Download F24" button, "Mark as paid" button
5. **Link to simulator**: "Try different scenarios →"

### Payment Tracking

Users can mark each F24 deadline as paid:
- Opens dialog with amount (pre-filled) and date paid
- Stored in the existing `tax_periods` DB table
- Paid amounts feed into `calcolaAccontoSaldo` for accurate saldo calculation
- Status badges: pending (grey), paid (green), overdue (red, if past deadline and unpaid)

## Tax Simulator (`/taxes/simulator`)

### Inputs (pre-populated from profile, all overridable)

- **Revenue**: number input + optional slider
- **ATECO code**: dropdown (defaults to profile's codiceAteco)
- **Gestione INPS**: dropdown — separata / artigiani / commercianti (defaults to profile)
- **Anno inizio attività**: number input (affects startup 5% vs ordinary 15%)

### Output

Same 3-card layout as the overview page. Computed client-side using the shared tax engine functions (`calcolaImposta`, `calcolaInps`, `calcolaAccontoSaldo`). No database writes. "Download F24" button available for simulated amounts too.

## F24 PDF Generation

### Approach

- **Template**: `docs/F24_editabile.pdf` (existing editable AcroForm PDF, bundled in API)
- **Library**: `pdf-lib` (pure JavaScript, no native dependencies)
- **Endpoint**: `GET /api/taxes/:anno/f24/:deadline` where deadline = `primo-acconto` | `secondo-acconto` | `saldo`

### Fields Filled

| PDF Field | Source |
|-----------|--------|
| `cf1`–`cf16` | Profile codice fiscale (one char per field) |
| `ragsociale` | Profile ragione sociale |
| `codtrib1` | Codice tributo (1790/1791/1792) |
| `annorif1` | Tax year |
| `impvers1` | Amount for the specific deadline |
| `tota` / `totb` | Section totals |
| `salab` | Saldo A-B |

One F24 PDF per deadline (not combined). Each pre-filled for the specific payment.

## API Changes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/taxes/overview?anno=YYYY` | GET | Tax calculations + payment records |
| `POST /api/taxes/payments` | POST | Record a payment (deadline, amount, date) |
| `GET /api/taxes/:anno/f24/:deadline` | GET | Generate pre-filled F24 PDF |

### `GET /api/taxes/overview` Response

```json
{
  "anno": 2026,
  "totalRevenue": 50000,
  "tax": { "coefficienteRedditivita": 78, "redditoLordo": 39000, ... },
  "inps": { "gestione": "separata", "totaleDovuto": 10167.3, ... },
  "f24": { "primoAcconto": 2162.5, "secondoAcconto": 2162.5, "saldo": 4325 },
  "payments": [
    { "deadline": "primo-acconto", "amount": 2162.5, "datePaid": "2026-06-28", "status": "paid" },
    { "deadline": "secondo-acconto", "amount": null, "datePaid": null, "status": "pending" },
    { "deadline": "saldo", "amount": null, "datePaid": null, "status": "pending" }
  ],
  "profileIncomplete": false
}
```

## Database

Use the existing `tax_periods` table (already defined in schema) to store payment records. Fields: `userId`, `anno`, `deadline` (enum), `amountDue`, `amountPaid`, `datePaid`.

The `f24_forms` and `inps_contributions` tables remain unused for now.

## Dependencies

- `pdf-lib` — added to `@fatturino/api` for F24 PDF generation

## Tech Notes

- Tax engine functions already exist in `@fatturino/shared` and are well-tested
- INPS is calculated first, its total deducted from imposta base (existing pattern from dashboard)
- Simulator uses the same shared functions client-side (already in the web bundle)
- The existing `POST /api/taxes/*` stateless endpoints are unused and can be removed or kept — the new overview endpoint supersedes them
