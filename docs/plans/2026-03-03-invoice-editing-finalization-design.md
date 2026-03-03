# Phase 5 — Invoice Editing + Finalization Design

## Goal

Allow users to edit draft invoices and finalize them by sending via email (PDF attached), transitioning status from `bozza` → `inviata`. Finalized invoices automatically count in dashboard revenue and tax calculations.

## Scope

### 1. Invoice Editing

**API:**
- `PUT /api/invoices/:id` — updates invoice header + replaces all line items
- Only works if `stato === 'bozza'` and user owns the invoice
- Recalculates bollo and totaleDocumento
- Transaction: update invoice → delete old lines → insert new lines
- `numeroFattura` stays the same (no renumbering)

**Frontend:**
- New route: `/invoices/:id/edit`
- Reuses `InvoiceForm` component, pre-filled with existing data
- "Edit" button on `InvoiceDetail` page (visible for `bozza` only)
- "Edit" icon on `Invoices` list (visible for drafts, next to delete)
- New `useUpdateInvoice` mutation hook with toast/error handling

**Validation:**
- Server-side: same Zod schema as create, plus ownership + bozza status check
- Field errors mapped via existing `parseApiFieldErrors`

### 2. Invoice Finalization via Email

**API:**
- `POST /api/invoices/:id/send` — validate → generate PDF → email via Resend → update status to `inviata`
- If email sending fails, status stays `bozza` (no partial state)
- Validates business rules before sending (reuses existing XML validation)

**Email Service:**
- `apps/api/src/services/email.ts` — wraps Resend SDK
- Env var: `RESEND_API_KEY`
- Sends to client's `email` field (fallback to `pec`)
- BCC to user's email (from auth session)
- PDF attachment only
- Simple HTML email template: invoice number, date, amount, forfettario disclaimer

**Schema Change:**
- Add optional `email` field to `clients` table
- Add email input to client form (ClientForm component)

**Frontend:**
- "Send Invoice" button on `InvoiceDetail` page (visible for `bozza` only)
- Confirmation dialog (AlertDialog): "This will email the invoice to {client} and mark it as sent. Continue?"
- On success: toast, status badge updates to `inviata`, edit/send buttons disappear
- New `useSendInvoice` mutation hook

### 3. Dashboard Integration

No changes needed. `aggregateDashboardData` already filters `nonDraft = invs.filter(i => i.stato !== "bozza")`. Once status flips to `inviata`, the invoice is automatically included in:
- Total revenue
- Invoices sent count
- Monthly revenue chart
- Tax/INPS/F24 calculations

### 4. i18n

New keys (EN + IT) for:
- Edit page labels, send button, confirmation dialog
- Email template text
- Toast messages (invoiceUpdated, invoiceSent)
- Client email field label

### 5. Testing

**Unit tests:**
- PUT endpoint: happy path, non-draft rejection, ownership check, bollo recalculation
- Send endpoint: happy path (mock Resend), non-draft rejection, missing client email

**E2E tests:**
- Create draft → edit lines → verify changes persisted
- Create draft → send → verify status changes to `inviata` and edit button disappears

## Architecture Notes

- Email service wrapped in clean service layer (swappable provider later)
- Resend SDK is lightweight (~10KB), no heavy dependencies
- PDF generation reuses existing Playwright-based `pdf-generator` service
- Invoice validation reuses existing `fattura-xml` business rules validator
