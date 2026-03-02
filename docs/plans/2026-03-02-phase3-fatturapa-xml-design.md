# Phase 3 — FatturaPA XML Generation + PDF Export

**Date:** 2026-03-02
**Status:** Approved
**Approach:** Hybrid — XML package + API-level PDF

## Overview

Generate compliant FatturaPA XML files (TD01 + TD04) with XSD and business rule validation, plus PDF export. Users download files and upload to their intermediary or the free Agenzia delle Entrate portal. No direct SDI integration in this phase.

## Architecture

### `packages/fattura-xml` — XML Builder + Validation

Pure TypeScript package with no I/O or DB dependencies. Consumes the same data shapes from existing Zod schemas.

**Structure:**
```
packages/fattura-xml/
├── src/
│   ├── index.ts                  # Public API exports
│   ├── builder.ts                # FatturaBuilder — assembles XML document
│   ├── sections/
│   │   ├── header.ts             # <FatturaElettronicaHeader>
│   │   ├── body.ts               # <FatturaElettronicaBody>
│   │   └── bollo.ts              # <DatiBollo> logic
│   ├── validation/
│   │   ├── xsd-validator.ts      # Validates against FatturaPA v1.2.2 XSD
│   │   └── business-rules.ts     # Forfettario-specific rules
│   ├── types.ts                  # FatturaInput, CedenteData, CessionarioData
│   └── xsd/
│       └── FatturaPA_v1.2.2.xsd  # Vendored official XSD
├── __tests__/
│   ├── builder.test.ts
│   ├── validation.test.ts
│   └── fixtures/                 # Sample valid/invalid XML
├── package.json
└── tsconfig.json
```

**Builder API:**
```ts
const xml = new FatturaBuilder()
  .setCedente(userProfile)
  .setCessionario(client)
  .setDatiGenerali(invoice)
  .setLinee(invoice.lines)
  .build();

const errors = validate(xml);
```

### Validation Layer

**XSD Validation:**
- Uses `libxmljs2` for schema validation against vendored XSD
- Returns structured errors with XPath location + human-readable message

**Business Rules (forfettario-specific):**

| Rule | Check |
|------|-------|
| Regime fiscale | Must be RF19 |
| Natura IVA | All lines must have N2.2 |
| Aliquota IVA | Must be 0.00 for all lines |
| Bollo | Required when imponibile > €77.47, must be €2.00 |
| Disclaimer | Causale must contain forfettario disclaimer text |
| Codice destinatario | 7 chars, or 0000000 with PEC present |
| P.IVA / Codice Fiscale | Format validation on cedente and cessionario |
| Tipo documento | Must be TD01 or TD04 |
| Numbering | NumeroFattura must match invoice record |

**Validation API:**
```ts
interface ValidationError {
  code: string;
  field: string;
  message: string;  // Italian
}

function validate(xml: string): ValidationError[]
function validateBusinessRules(input: FatturaInput): ValidationError[]
```

Business rules run on input data before XML generation (fail fast). XSD validation runs on generated XML as a final safety net.

### PDF Generation

Uses Playwright (already in project) to render a standalone HTML template to PDF.

**Flow:**
1. API receives `GET /api/invoices/:id/pdf`
2. Fetches invoice + client + user profile from DB
3. Renders standalone HTML template with inline CSS (not the React InvoicePreview component)
4. Playwright headless Chromium: `page.pdf()` with A4 format
5. Returns PDF buffer as `application/pdf`

**Why standalone HTML instead of InvoicePreview.tsx:**
- No React runtime, i18next, or Shadcn CSS dependencies
- Faster, simpler, consistent output
- Matches visual style but is self-contained

**Performance:** Playwright browser instance reused across requests (launch once, new pages per request).

**Template location:** `apps/api/src/services/pdf/invoice-template.ts`

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/invoices/:id/xml` | Generate + validate + return FatturaPA XML |
| GET | `/api/invoices/:id/pdf` | Generate + return PDF |
| GET | `/api/invoices/:id/xml/validate` | Validate only, return errors |

**XML download flow:**
1. Fetch invoice + lines + client + user profile
2. Business rule validation → 422 with errors if invalid
3. Build XML via FatturaBuilder
4. XSD validation → 500 if fails (bug in builder)
5. Optionally store XML in `invoices.xmlContent` column
6. Return as `application/xml` with filename `IT{partitaIva}_{progressivo}.xml`

**User profile requirement:** XML generation requires user business details as cedente prestatore. Returns 400 if profile incomplete.

### Frontend Changes

**InvoiceDetail action bar:**
- **"Valida"** — calls `/xml/validate`, shows success toast or validation errors inline
- **"Scarica XML"** — downloads .xml file (disabled if validation errors exist)
- **"Scarica PDF"** — downloads PDF (always available)

**Validation error display:**
- Dismissible alert below action bar
- Each error shows field name + Italian message
- Links to Settings if error is missing user profile

**User profile gate:**
- Check if user profile exists before XML operations
- Banner: "Completa il tuo profilo per generare fatture elettroniche" with link to Settings

**Settings page (minimal):**
- User profile form (ragione sociale, P.IVA, codice fiscale, address, PEC, codice SDI, etc.)
- Required for XML generation to work

### CI/CD — GitHub Actions

**Workflow: `.github/workflows/ci.yml`**

Triggered on PR and push to `main`.

**Pipeline:**
1. Setup — Node 20, pnpm, dependency caching
2. Lint & Type Check — `pnpm lint` + `pnpm typecheck` (parallel)
3. Unit Tests — `pnpm test` (vitest across all packages)
4. E2E Tests — PostgreSQL 16 service container, migrations, dev servers, Playwright
5. Build — `pnpm build` to verify production build

**E2E specifics:**
- PostgreSQL 16 as GitHub Actions service container
- Playwright browser caching
- Dev servers started in background

## Out of Scope

- Direct SDI integration (sending/receiving)
- Invoice editing (PUT endpoint)
- Invoice status workflow (mark as sent)
- Batch XML generation
- XML preview in browser
- Deploy pipeline / preview deploys
- Release/tag workflows
