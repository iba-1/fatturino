# Design: Complete data-testid Migration for E2E Tests

**Date:** 2026-03-05
**Status:** Approved

## Background

The `refactor/e2e-data-testid` branch migrated most e2e selectors to `data-testid` attributes but missed three test files: `error-handling.spec.ts`, `invoice-xml.spec.ts`, and `taxes.spec.ts`. These still use fragile selectors such as `li[data-state="open"]` (Radix UI internal), `form .text-destructive` (CSS class), `input[id="..."]`, `select[id="..."]`, and `button[type="submit"]`.

## Goal

Complete Option A: full migration so every e2e selector uses `data-testid`.

## Source Changes

### `apps/web/src/components/ui/toaster.tsx`
- Add `data-testid="toast"` to the `<Toast>` element rendered in the map.

### `apps/web/src/components/ProfileForm.tsx`
- Add `data-testid="input-ragione-sociale"` to ragioneSociale Input
- Add `data-testid="input-partita-iva"` to partitaIva Input
- Add `data-testid="input-codice-fiscale"` to codiceFiscale Input
- Add `data-testid="input-codice-ateco"` to codiceAteco Input
- Add `data-testid="input-indirizzo"` to indirizzo Input
- Add `data-testid="input-cap"` to cap Input
- Add `data-testid="input-citta"` to citta Input
- Add `data-testid="input-provincia"` to provincia Input
- Add `data-testid="input-anno-inizio-attivita"` to annoInizioAttivita Input
- Add `data-testid="btn-submit-profile"` to submit Button
- Add `data-testid="field-error"` to each error `<p>` element

### `apps/web/src/components/ClientForm.tsx`
- Add `data-testid="input-ragione-sociale"` to ragioneSociale Input
- Add `data-testid="input-codice-fiscale"` to codiceFiscale Input
- Add `data-testid="input-partita-iva"` to partitaIva Input
- Add `data-testid="input-indirizzo"` to indirizzo Input
- Add `data-testid="input-cap"` to cap Input
- Add `data-testid="input-citta"` to citta Input
- Add `data-testid="input-provincia"` to provincia Input
- Add `data-testid="input-codice-sdi"` to codiceSdi Input
- (Submit button already has `data-testid="btn-submit-client"`)

### `apps/web/src/pages/TaxSimulator.tsx`
- Add `data-testid="input-fatturato"` to fatturato Input
- Add `data-testid="input-codice-ateco"` to codiceAteco Input
- Add `data-testid="select-gestione"` to gestione `<select>`
- Add `data-testid="input-anno-inizio"` to annoInizio Input
- Add `data-testid="input-anno-fiscale"` to annoFiscale Input

## Test Changes

### `e2e/error-handling.spec.ts`
- `li[data-state="open"]` (×4) → `[data-testid="toast"]`
- `form .text-destructive` → `[data-testid="field-error"]`
- Profile form `input[id="..."]` → `[data-testid="input-..."]`
- `button[type="submit"]` (profile, ×2) → `[data-testid="btn-submit-profile"]`
- Client form `input[id="..."]` → `[data-testid="input-..."]`
- `[role="dialog"] button[type="submit"]` → `[data-testid="btn-submit-client"]`

### `e2e/invoice-xml.spec.ts`
- Client form `input[id="..."]` → `[data-testid="input-..."]`
- `[role="dialog"] button[type="submit"]` → `[data-testid="btn-submit-client"]`
- Profile form `input[id="..."]` → `[data-testid="input-..."]`
- `button[type="submit"]` (profile) → `[data-testid="btn-submit-profile"]`

### `e2e/taxes.spec.ts`
- `a[href="/taxes/simulator"]` → `[data-testid="link-simulator"]` (source already has this)
- `input[id="fatturato"]` → `[data-testid="input-fatturato"]`
- `input[id="codiceAteco"]` → `[data-testid="input-codice-ateco"]`
- `select[id="gestione"]` → `[data-testid="select-gestione"]`
- `input[id="annoInizio"]` → `[data-testid="input-anno-inizio"]`
- `input[id="annoFiscale"]` → `[data-testid="input-anno-fiscale"]`

## Naming Convention

| Type | Pattern | Example |
|---|---|---|
| Input | `input-{kebab-field}` | `input-ragione-sociale` |
| Select | `select-{field}` | `select-gestione` |
| Button | `btn-{action}` | `btn-submit-profile` |
| Field error | `field-error` | generic — tests only assert existence |
| Toast | `toast` | one per notification |

## Constraints

- No behaviour changes — purely additive `data-testid` attributes
- No new files needed
- Must pass existing e2e suite after changes
