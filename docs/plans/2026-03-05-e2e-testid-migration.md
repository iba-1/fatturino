# E2E data-testid Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all remaining fragile e2e selectors (`li[data-state="open"]`, `form .text-destructive`, `input[id="..."]`, `select[id="..."]`, `button[type="submit"]`) with stable `data-testid` attributes across three test files.

**Architecture:** Purely additive changes — add `data-testid` props to 4 source components, then update 3 test files to use those new testids. No behaviour changes, no new files.

**Tech Stack:** React 19, Playwright e2e tests, shadcn/ui (Radix UI) Toast primitive

---

### Task 1: Add data-testid="toast" to Toaster

**Files:**
- Modify: `apps/web/src/components/ui/toaster.tsx`

**Step 1: Add the attribute**

In `toaster.tsx`, the `<Toast>` element inside the `.map()` call needs `data-testid="toast"`. Change:

```tsx
<Toast key={id} {...props}>
```
to:
```tsx
<Toast key={id} data-testid="toast" {...props}>
```

**Step 2: Verify no TypeScript errors**

```bash
pnpm --filter @fatturino/web type-check
```
Expected: no errors (Toast spreads arbitrary props through to the Radix primitive).

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/toaster.tsx
git commit -m "refactor: add data-testid=toast to Toaster"
```

---

### Task 2: Add data-testids to ProfileForm

**Files:**
- Modify: `apps/web/src/components/ProfileForm.tsx`

**Step 1: Add data-testid to each Input and the submit Button**

Add `data-testid` to the following elements (match `id` attribute to kebab field name):

| Element | id | data-testid |
|---|---|---|
| ragioneSociale Input | `ragioneSociale` | `input-ragione-sociale` |
| partitaIva Input | `partitaIva` | `input-partita-iva` |
| codiceFiscale Input | `codiceFiscale` | `input-codice-fiscale` |
| codiceAteco Input | `codiceAteco` | `input-codice-ateco` |
| indirizzo Input | `indirizzo` | `input-indirizzo` |
| cap Input | `cap` | `input-cap` |
| citta Input | `citta` | `input-citta` |
| provincia Input | `provincia` | `input-provincia` |
| annoInizioAttivita Input | `annoInizioAttivita` | `input-anno-inizio-attivita` |
| submit Button | — | `btn-submit-profile` |

Example for ragioneSociale (same pattern for all others):
```tsx
<Input
  id="ragioneSociale"
  data-testid="input-ragione-sociale"
  value={ragioneSociale}
  onChange={(e) => setRagioneSociale(e.target.value)}
  required
/>
```

Submit button:
```tsx
<Button type="submit" disabled={isLoading} data-testid="btn-submit-profile">
```

**Step 2: Add data-testid="field-error" to every error `<p>` element**

There are ~10 error paragraphs like:
```tsx
{serverErrors.ragioneSociale && (
  <p className="text-sm text-destructive">{serverErrors.ragioneSociale}</p>
)}
```
Add `data-testid="field-error"` to every one of them:
```tsx
{serverErrors.ragioneSociale && (
  <p className="text-sm text-destructive" data-testid="field-error">{serverErrors.ragioneSociale}</p>
)}
```

**Step 3: Verify no TypeScript errors**

```bash
pnpm --filter @fatturino/web type-check
```
Expected: no errors.

**Step 4: Commit**

```bash
git add apps/web/src/components/ProfileForm.tsx
git commit -m "refactor: add data-testid attributes to ProfileForm inputs"
```

---

### Task 3: Add data-testids to ClientForm inputs

**Files:**
- Modify: `apps/web/src/components/ClientForm.tsx`

**Step 1: Add data-testid to each Input**

The submit button already has `data-testid="btn-submit-client"`. Add to inputs:

| Element | id | data-testid |
|---|---|---|
| ragioneSociale Input | `ragioneSociale` | `input-ragione-sociale` |
| codiceFiscale Input | `codiceFiscale` | `input-codice-fiscale` |
| partitaIva Input | `partitaIva` | `input-partita-iva` |
| indirizzo Input | `indirizzo` | `input-indirizzo` |
| cap Input | `cap` | `input-cap` |
| citta Input | `citta` | `input-citta` |
| provincia Input | `provincia` | `input-provincia` |
| codiceSdi Input | `codiceSdi` | `input-codice-sdi` |

Same pattern as ProfileForm — add `data-testid="input-xxx"` alongside the existing `id="xxx"`.

**Step 2: Verify no TypeScript errors**

```bash
pnpm --filter @fatturino/web type-check
```
Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/components/ClientForm.tsx
git commit -m "refactor: add data-testid attributes to ClientForm inputs"
```

---

### Task 4: Add data-testids to TaxSimulator inputs

**Files:**
- Modify: `apps/web/src/pages/TaxSimulator.tsx`

**Step 1: Add data-testid to each input field**

| Element | id | data-testid |
|---|---|---|
| fatturato Input | `fatturato` | `input-fatturato` |
| codiceAteco Input | `codiceAteco` | `input-codice-ateco` |
| gestione `<select>` | `gestione` | `select-gestione` |
| annoInizio Input | `annoInizio` | `input-anno-inizio` |
| annoFiscale Input | `annoFiscale` | `input-anno-fiscale` |

For the `<select>` (it's a native `<select>`, not a shadcn Select):
```tsx
<select
  id="gestione"
  data-testid="select-gestione"
  className="..."
  value={gestione}
  onChange={(e) => setGestione(e.target.value as GestioneInps)}
>
```

**Step 2: Verify no TypeScript errors**

```bash
pnpm --filter @fatturino/web type-check
```
Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/pages/TaxSimulator.tsx
git commit -m "refactor: add data-testid attributes to TaxSimulator inputs"
```

---

### Task 5: Update error-handling.spec.ts

**Files:**
- Modify: `e2e/error-handling.spec.ts`

**Step 1: Replace all fragile selectors**

Make these replacements throughout the file:

| Old selector | New selector |
|---|---|
| `'input[id="ragioneSociale"]'` | `'[data-testid="input-ragione-sociale"]'` |
| `'input[id="partitaIva"]'` | `'[data-testid="input-partita-iva"]'` |
| `'input[id="codiceFiscale"]'` | `'[data-testid="input-codice-fiscale"]'` |
| `'input[id="codiceAteco"]'` | `'[data-testid="input-codice-ateco"]'` |
| `'input[id="indirizzo"]'` | `'[data-testid="input-indirizzo"]'` |
| `'input[id="cap"]'` | `'[data-testid="input-cap"]'` |
| `'input[id="citta"]'` | `'[data-testid="input-citta"]'` |
| `'input[id="provincia"]'` | `'[data-testid="input-provincia"]'` |
| `'input[id="annoInizioAttivita"]'` | `'[data-testid="input-anno-inizio-attivita"]'` |
| `'button[type="submit"]'` | `'[data-testid="btn-submit-profile"]'` |
| `'[role="dialog"] button[type="submit"]'` | `'[data-testid="btn-submit-client"]'` |
| `'li[data-state="open"]'` (×4) | `'[data-testid="toast"]'` |
| `'form .text-destructive'` | `'[data-testid="field-error"]'` |

The `form .text-destructive` assertion checks `.toBeVisible()` — keep that, just change the locator:
```ts
// Before
await expect(page.locator("form .text-destructive")).toBeVisible({ timeout: 5_000 });

// After
await expect(page.locator('[data-testid="field-error"]')).toBeVisible({ timeout: 5_000 });
```

**Step 2: Commit**

```bash
git add e2e/error-handling.spec.ts
git commit -m "test(e2e): migrate error-handling selectors to data-testid"
```

---

### Task 6: Update invoice-xml.spec.ts

**Files:**
- Modify: `e2e/invoice-xml.spec.ts`

**Step 1: Replace all fragile selectors**

Apply the same input/button replacements as Task 5. Full mapping for this file:

| Old | New |
|---|---|
| `'input[id="ragioneSociale"]'` | `'[data-testid="input-ragione-sociale"]'` |
| `'input[id="codiceFiscale"]'` | `'[data-testid="input-codice-fiscale"]'` |
| `'input[id="partitaIva"]'` | `'[data-testid="input-partita-iva"]'` |
| `'input[id="indirizzo"]'` | `'[data-testid="input-indirizzo"]'` |
| `'input[id="cap"]'` | `'[data-testid="input-cap"]'` |
| `'input[id="citta"]'` | `'[data-testid="input-citta"]'` |
| `'input[id="provincia"]'` | `'[data-testid="input-provincia"]'` |
| `'input[id="codiceSdi"]'` | `'[data-testid="input-codice-sdi"]'` |
| `'[role="dialog"] button[type="submit"]'` | `'[data-testid="btn-submit-client"]'` |
| `'button[type="submit"]'` (profile form) | `'[data-testid="btn-submit-profile"]'` |

Note: The two assertions at lines 121-122 that check `.toHaveValue()` after profile save also use `input[id="..."]` — replace these too:
```ts
// Before
await expect(page.locator('input[id="ragioneSociale"]')).toHaveValue("Mario Rossi Freelance");
await expect(page.locator('input[id="partitaIva"]')).toHaveValue("12345678901");

// After
await expect(page.locator('[data-testid="input-ragione-sociale"]')).toHaveValue("Mario Rossi Freelance");
await expect(page.locator('[data-testid="input-partita-iva"]')).toHaveValue("12345678901");
```

**Step 2: Commit**

```bash
git add e2e/invoice-xml.spec.ts
git commit -m "test(e2e): migrate invoice-xml selectors to data-testid"
```

---

### Task 7: Update taxes.spec.ts

**Files:**
- Modify: `e2e/taxes.spec.ts`

**Step 1: Replace all fragile selectors**

| Old | New |
|---|---|
| `'a[href="/taxes/simulator"]'` | `'[data-testid="link-simulator"]'` |
| `'input[id="fatturato"]'` | `'[data-testid="input-fatturato"]'` |
| `'input[id="codiceAteco"]'` | `'[data-testid="input-codice-ateco"]'` |
| `'select[id="gestione"]'` | `'[data-testid="select-gestione"]'` |
| `'input[id="annoInizio"]'` | `'[data-testid="input-anno-inizio"]'` |
| `'input[id="annoFiscale"]'` | `'[data-testid="input-anno-fiscale"]'` |

Note: `data-testid="link-simulator"` is already present in `Taxes.tsx` (line 225) — only the test needs updating.

**Step 2: Commit**

```bash
git add e2e/taxes.spec.ts
git commit -m "test(e2e): migrate taxes selectors to data-testid"
```

---

### Task 8: Final verification

**Step 1: Run full e2e suite locally**

Make sure the dev server and API are running, then:
```bash
pnpm test:e2e
```
Expected: all tests pass (same count as before this migration).

**Step 2: Verify no remaining fragile selectors**

```bash
grep -rn "getByRole\|getByText\|getByPlaceholder\|input\[id=\|select\[id=\|button\[type=\|data-state=" e2e/ --include="*.ts"
```
Expected: only `li[data-state` hits should be gone; any remaining results should be intentional (e.g. `[role="dialog"]` for dialog existence checks, `[role="option"]` for Combobox options, `[role="menuitem"]` for dropdown items — these are ARIA roles, not test-id selectors, and are acceptable).

**Step 3: Push and verify CI passes**

```bash
git push
```
Then check the GitHub Actions run. Do not claim done until CI is green.
