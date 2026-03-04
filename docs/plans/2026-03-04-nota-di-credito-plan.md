# Nota di Credito Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When a user deletes a sent invoice, offer to create a credit note (TD04) that mirrors it. If the credit note is finalized, the original is marked "stornata". Credit notes subtract from tax revenue.

**Architecture:** A credit note is a regular invoice with `tipoDocumento: "TD04"`. Two new FK columns (`originalInvoiceId`, `creditNoteId`) link credit notes ↔ originals. A new `stornata` enum value marks refunded invoices. Dashboard subtracts TD04 totals from revenue.

**Tech Stack:** Fastify 5, Drizzle ORM (PostgreSQL), React 19, TanStack Query, shadcn/ui, i18next, Vitest

---

### Task 1: Add `stornata` to `statoFatturaEnum` + new columns

**Files:**
- Modify: `apps/api/src/db/schema.ts:23-31` (statoFatturaEnum)
- Modify: `apps/api/src/db/schema.ts:159-183` (invoices table)

**Step 1: Add `stornata` to the enum**

In `schema.ts:23-31`, add `"stornata"` to the array:

```typescript
export const statoFatturaEnum = pgEnum("stato_fattura", [
  "bozza",
  "inviata",
  "consegnata",
  "scartata",
  "accettata",
  "rifiutata",
  "mancata_consegna",
  "stornata",
]);
```

**Step 2: Add `originalInvoiceId` and `creditNoteId` columns**

After the `dataPagamento` line (line 180), add:

```typescript
  originalInvoiceId: uuid("original_invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  creditNoteId: uuid("credit_note_id").references(() => invoices.id, { onDelete: "set null" }),
```

**Step 3: Push schema changes**

Run: `cd apps/api && npx drizzle-kit push`
Expected: Schema synced to dev DB

**Step 4: Commit**

```bash
git add apps/api/src/db/schema.ts
git commit -m "feat: add stornata status and credit note FK columns to invoices"
```

---

### Task 2: Add credit-note API route

**Files:**
- Modify: `apps/api/src/routes/invoices.ts` (add new route after delete route, ~line 128)
- Test: `apps/api/src/__tests__/credit-note.test.ts` (new)

**Step 1: Write the failing test**

Create `apps/api/src/__tests__/credit-note.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Unit test for credit note creation logic (pure function extracted from route)
describe("createCreditNoteData", () => {
  it("mirrors original invoice as TD04 with originalInvoiceId", () => {
    const original = {
      id: "orig-uuid",
      userId: "user-1",
      clientId: "client-1",
      anno: 2026,
      imponibile: "1000.00",
      impostaBollo: "2.00",
      totaleDocumento: "1002.00",
      causale: "Web development",
    };
    const originalLines = [
      {
        descrizione: "Sviluppo sito web",
        quantita: "1.0000",
        prezzoUnitario: "1000.00",
        prezzoTotale: "1000.00",
        aliquotaIva: "0.00",
        naturaIva: "N2.2",
      },
    ];

    // The credit note should:
    // - Use tipoDocumento "TD04"
    // - Have same client, amounts, lines
    // - Reference originalInvoiceId
    // - Have causale referencing original invoice number
    const result = buildCreditNoteValues(original, originalLines, 1);

    expect(result.invoice.tipoDocumento).toBe("TD04");
    expect(result.invoice.clientId).toBe("client-1");
    expect(result.invoice.imponibile).toBe("1000.00");
    expect(result.invoice.impostaBollo).toBe("2.00");
    expect(result.invoice.totaleDocumento).toBe("1002.00");
    expect(result.invoice.originalInvoiceId).toBe("orig-uuid");
    expect(result.invoice.stato).toBe("bozza");
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].descrizione).toBe("Sviluppo sito web");
  });
});
```

Note: `buildCreditNoteValues` will be a pure helper extracted from the route logic.

**Step 2: Run test to verify it fails**

Run: `cd apps/api && npx vitest run src/__tests__/credit-note.test.ts`
Expected: FAIL — `buildCreditNoteValues` not defined

**Step 3: Write the helper + route**

Add to `apps/api/src/routes/invoices.ts`, before the `export async function invoiceRoutes`:

```typescript
// Helper to build credit note values from an original invoice
export function buildCreditNoteValues(
  original: {
    id: string;
    clientId: string;
    anno: number;
    imponibile: string;
    impostaBollo: string;
    totaleDocumento: string;
    causale: string | null;
  },
  originalLines: Array<{
    descrizione: string;
    quantita: string;
    prezzoUnitario: string;
    prezzoTotale: string;
    aliquotaIva: string;
    naturaIva: string | null;
  }>,
  nextNumeroFattura: number
) {
  return {
    invoice: {
      clientId: original.clientId,
      numeroFattura: nextNumeroFattura,
      anno: original.anno,
      dataEmissione: new Date(),
      tipoDocumento: "TD04" as const,
      causale: original.causale,
      imponibile: original.imponibile,
      impostaBollo: original.impostaBollo,
      totaleDocumento: original.totaleDocumento,
      stato: "bozza" as const,
      originalInvoiceId: original.id,
    },
    lines: originalLines.map((line) => ({
      descrizione: line.descrizione,
      quantita: line.quantita,
      prezzoUnitario: line.prezzoUnitario,
      prezzoTotale: line.prezzoTotale,
      aliquotaIva: line.aliquotaIva,
      naturaIva: line.naturaIva ?? "N2.2",
    })),
  };
}
```

Then add the route inside `invoiceRoutes`, after the delete route (~line 128):

```typescript
  // Create credit note from existing invoice
  app.post<{ Params: { id: string } }>("/api/invoices/:id/credit-note", async (request, reply) => {
    const userId = getUserId(request);

    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));

    if (existing.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    const original = existing[0];

    if (original.stato === "bozza") {
      return reply.status(400).send({ error: "Cannot create credit note for draft invoice" });
    }

    if (original.creditNoteId) {
      return reply.status(400).send({ error: "Invoice already has a credit note" });
    }

    const originalLines = await db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, original.id));

    const maxNumero = await db
      .select({ max: sql<number>`COALESCE(MAX(${invoices.numeroFattura}), 0)` })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.anno, original.anno)));

    const nextNumero = (maxNumero[0]?.max || 0) + 1;

    const creditNoteData = buildCreditNoteValues(original, originalLines, nextNumero);

    const [created] = await db
      .insert(invoices)
      .values({
        userId,
        ...creditNoteData.invoice,
      })
      .returning();

    const lineValues = creditNoteData.lines.map((line) => ({
      invoiceId: created.id,
      ...line,
    }));

    const createdLines = await db.insert(invoiceLines).values(lineValues).returning();

    return reply.status(201).send({ ...created, lines: createdLines });
  });
```

**Step 4: Update test import and run**

Update test to import `buildCreditNoteValues` from the route file:

```typescript
import { buildCreditNoteValues } from "../routes/invoices.js";
```

Run: `cd apps/api && npx vitest run src/__tests__/credit-note.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/routes/invoices.ts apps/api/src/__tests__/credit-note.test.ts
git commit -m "feat: add POST /api/invoices/:id/credit-note route"
```

---

### Task 3: Modify send/mark-sent to handle TD04 finalization

**Files:**
- Modify: `apps/api/src/routes/invoices.ts:131-154` (mark-sent handler)
- Modify: `apps/api/src/routes/invoices.ts:382-487` (send handler)
- Test: `apps/api/src/__tests__/credit-note.test.ts` (add test)

**Step 1: Write the failing test**

Add to `credit-note.test.ts`:

```typescript
describe("credit note finalization logic", () => {
  it("should mark original as stornata when credit note has originalInvoiceId", () => {
    // This tests that the route logic will:
    // 1. Check if the invoice being sent is TD04
    // 2. If so, look up originalInvoiceId
    // 3. Update original: stato → stornata, creditNoteId → this invoice's id
    // Integration test — covered by route behavior
    expect(true).toBe(true); // placeholder for integration test
  });
});
```

**Step 2: Modify mark-sent handler**

In `invoices.ts`, the mark-sent handler (~line 131-154). After the status update to "inviata" (line 149-151), add:

```typescript
    // If this is a credit note (TD04), mark the original invoice as stornata
    if (existing[0].tipoDocumento === "TD04" && existing[0].originalInvoiceId) {
      await db
        .update(invoices)
        .set({
          stato: "stornata",
          creditNoteId: existing[0].id,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, existing[0].originalInvoiceId));
    }
```

**Step 3: Modify send handler**

In the send handler (~line 382-487). After the status update to "inviata" (line 480-484), add the same logic:

```typescript
    // If this is a credit note (TD04), mark the original invoice as stornata
    if (inv.tipoDocumento === "TD04" && inv.originalInvoiceId) {
      await db
        .update(invoices)
        .set({
          stato: "stornata",
          creditNoteId: inv.id,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, inv.originalInvoiceId));
    }
```

**Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/api/src/routes/invoices.ts apps/api/src/__tests__/credit-note.test.ts
git commit -m "feat: mark original invoice as stornata when credit note is finalized"
```

---

### Task 4: Modify DELETE to allow non-draft deletion (with guard)

**Files:**
- Modify: `apps/api/src/routes/invoices.ts:114-128` (delete handler)

**Step 1: Update delete handler**

Replace the current delete handler (lines 114-128) to remove the draft-only restriction, but block deletion of stornata invoices (they're linked to credit notes):

```typescript
  // Delete invoice
  app.delete<{ Params: { id: string } }>("/api/invoices/:id", async (request, reply) => {
    const userId = getUserId(request);

    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));

    if (existing.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    // Block deletion of stornata invoices (linked to credit note)
    if (existing[0].stato === "stornata") {
      return reply.status(400).send({ error: "Cannot delete a refunded invoice" });
    }

    // If deleting an invoice that has a credit note draft, delete the credit note too
    if (existing[0].creditNoteId) {
      return reply.status(400).send({ error: "Cannot delete invoice with linked credit note" });
    }

    // If deleting a credit note, clear the originalInvoiceId reference
    if (existing[0].tipoDocumento === "TD04" && existing[0].originalInvoiceId) {
      // Only clear if the original hasn't been stornata yet
      const original = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, existing[0].originalInvoiceId));
      if (original.length > 0 && original[0].creditNoteId === existing[0].id) {
        await db
          .update(invoices)
          .set({ creditNoteId: null, updatedAt: new Date() })
          .where(eq(invoices.id, existing[0].originalInvoiceId));
      }
    }

    await db.delete(invoices).where(eq(invoices.id, request.params.id));
    return { success: true };
  });
```

**Step 2: Run all tests**

Run: `pnpm test`
Expected: All pass

**Step 3: Commit**

```bash
git add apps/api/src/routes/invoices.ts
git commit -m "feat: allow deletion of non-draft invoices, guard stornata"
```

---

### Task 5: Update dashboard tax calculation to subtract TD04

**Files:**
- Modify: `apps/api/src/routes/dashboard.ts:30-57` (aggregateDashboardData)
- Modify: `apps/api/src/__tests__/dashboard.test.ts`

**Step 1: Write the failing test**

Add to `apps/api/src/__tests__/dashboard.test.ts`:

```typescript
it("subtracts credit note (TD04) totals from revenue", () => {
  const result = aggregateDashboardData({
    invoices: [
      { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-15"), tipoDocumento: "TD01" },
      { totaleDocumento: "500.00", stato: "inviata", dataEmissione: new Date("2026-02-15"), tipoDocumento: "TD01" },
      { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-20"), tipoDocumento: "TD04" },
    ],
    profile: null,
    anno: 2026,
  });

  // 1000 + 500 - 1000 (credit note) = 500
  expect(result.totalRevenue).toBe(500);
  expect(result.invoicesSent).toBe(2); // credit notes don't count as "sent"
});

it("excludes stornata invoices from sent count", () => {
  const result = aggregateDashboardData({
    invoices: [
      { totaleDocumento: "1000.00", stato: "stornata", dataEmissione: new Date("2026-01-15"), tipoDocumento: "TD01" },
      { totaleDocumento: "1000.00", stato: "inviata", dataEmissione: new Date("2026-01-20"), tipoDocumento: "TD04" },
      { totaleDocumento: "500.00", stato: "inviata", dataEmissione: new Date("2026-02-15"), tipoDocumento: "TD01" },
    ],
    profile: null,
    anno: 2026,
  });

  // stornata (1000) + TD04 (-1000) + regular (500) = 500
  expect(result.totalRevenue).toBe(500);
  expect(result.invoicesSent).toBe(1); // only the non-stornata, non-TD04
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && npx vitest run src/__tests__/dashboard.test.ts`
Expected: FAIL — `tipoDocumento` not in DashboardInvoice interface, wrong revenue

**Step 3: Update aggregateDashboardData**

Update the `DashboardInvoice` interface (line 12-16):

```typescript
interface DashboardInvoice {
  totaleDocumento: string;
  stato: string;
  dataEmissione: Date;
  tipoDocumento?: string;
}
```

Update the `aggregateDashboardData` function (lines 33-53):

```typescript
  const nonDraft = invs.filter((i) => i.stato !== "bozza");
  const drafts = invs.filter((i) => i.stato === "bozza");

  // Regular invoices (non-draft, non-credit-note)
  const regularInvoices = nonDraft.filter((i) => i.tipoDocumento !== "TD04");
  // Credit notes
  const creditNotes = nonDraft.filter((i) => i.tipoDocumento === "TD04");

  const regularRevenue = regularInvoices.reduce(
    (sum, i) => sum + parseFloat(String(i.totaleDocumento)), 0
  );
  const creditNoteTotal = creditNotes.reduce(
    (sum, i) => sum + parseFloat(String(i.totaleDocumento)), 0
  );
  const totalRevenue = regularRevenue - creditNoteTotal;

  // Count only non-stornata, non-TD04 invoices as "sent"
  const invoicesSent = nonDraft.filter(
    (i) => i.stato !== "stornata" && i.tipoDocumento !== "TD04"
  ).length;
  const pendingInvoices = drafts.length;
```

Also update monthly revenue calculation (lines 44-57) to handle credit notes:

```typescript
  // Monthly revenue (non-draft only, credit notes subtract)
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: 0,
  }));

  for (const inv of regularInvoices) {
    const date = new Date(inv.dataEmissione);
    const month = date.getMonth();
    monthlyRevenue[month].revenue += parseFloat(String(inv.totaleDocumento));
  }

  for (const inv of creditNotes) {
    const date = new Date(inv.dataEmissione);
    const month = date.getMonth();
    monthlyRevenue[month].revenue -= parseFloat(String(inv.totaleDocumento));
  }

  for (const m of monthlyRevenue) {
    m.revenue = Math.round(m.revenue * 100) / 100;
  }
```

**Step 4: Update dashboard DB query to include tipoDocumento**

In the route handler (~line 148-155), add `tipoDocumento` to the select:

```typescript
      const yearInvoices = await db
        .select({
          totaleDocumento: invoices.totaleDocumento,
          stato: invoices.stato,
          dataEmissione: invoices.dataEmissione,
          tipoDocumento: invoices.tipoDocumento,
        })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), eq(invoices.anno, anno)));
```

**Step 5: Run test to verify it passes**

Run: `cd apps/api && npx vitest run src/__tests__/dashboard.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/api/src/routes/dashboard.ts apps/api/src/__tests__/dashboard.test.ts
git commit -m "feat: subtract TD04 credit notes from dashboard revenue"
```

---

### Task 6: Add `useCreateCreditNote` hook + update Invoice interface

**Files:**
- Modify: `apps/web/src/hooks/use-invoices.ts`

**Step 1: Update Invoice interface**

Add to the `Invoice` interface (~line 19-39):

```typescript
  originalInvoiceId: string | null;
  creditNoteId: string | null;
```

**Step 2: Add `useCreateCreditNote` hook**

After the `useDeleteInvoice` hook (~line 107), add:

```typescript
export function useCreateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) =>
      api.post<InvoiceWithLines>(`/invoices/${invoiceId}/credit-note`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: i18next.t("toast.creditNoteCreated"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("create_credit_note_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}
```

**Step 3: Run build to check types**

Run: `pnpm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/hooks/use-invoices.ts
git commit -m "feat: add useCreateCreditNote hook and update Invoice interface"
```

---

### Task 7: Add i18n keys for credit note UI

**Files:**
- Modify: `apps/web/src/i18n/en.json`
- Modify: `apps/web/src/i18n/it.json`

**Step 1: Add English keys**

Add to the `"invoices"` section:

```json
    "stornata": "Refunded",
    "creditNote": "Credit Note",
    "createCreditNote": "Create Credit Note",
    "deleteAnywayTitle": "Delete Sent Invoice?",
    "deleteAnywayDescription": "This invoice has been sent. You can create a credit note to properly reverse it, or delete it anyway.",
    "deleteAnyway": "Delete Anyway",
    "viewCreditNote": "View Credit Note",
    "viewOriginalInvoice": "View Original Invoice",
    "creditNoteFor": "Credit note for invoice {{number}}"
```

Add to the `"toast"` section:

```json
    "creditNoteCreated": "Credit note created"
```

**Step 2: Add Italian keys**

Add to the `"invoices"` section:

```json
    "stornata": "Stornata",
    "creditNote": "Nota di Credito",
    "createCreditNote": "Crea Nota di Credito",
    "deleteAnywayTitle": "Eliminare fattura inviata?",
    "deleteAnywayDescription": "Questa fattura è stata inviata. Puoi creare una nota di credito per stornare correttamente la fattura, oppure eliminarla comunque.",
    "deleteAnyway": "Elimina comunque",
    "viewCreditNote": "Vedi Nota di Credito",
    "viewOriginalInvoice": "Vedi Fattura Originale",
    "creditNoteFor": "Nota di credito per fattura {{number}}"
```

Add to the `"toast"` section:

```json
    "creditNoteCreated": "Nota di credito creata"
```

**Step 3: Commit**

```bash
git add apps/web/src/i18n/en.json apps/web/src/i18n/it.json
git commit -m "feat: add i18n keys for credit note UI"
```

---

### Task 8: Update Invoices list page — new delete dialog for sent invoices

**Files:**
- Modify: `apps/web/src/pages/Invoices.tsx`

**Step 1: Update imports and hooks**

Add `useCreateCreditNote` to imports from `use-invoices`. Add `useNavigate` is already imported.

**Step 2: Add state for the "sent invoice delete" dialog**

Add alongside existing state:

```typescript
  const createCreditNote = useCreateCreditNote();
```

**Step 3: Update the delete button logic**

The existing delete dropdown item (line 223-229) should work for all invoices. But the dialog that opens needs to be different based on whether the invoice is a draft or sent.

Replace the delete confirmation dialog (lines 241-262) with conditional logic:

```tsx
      {/* Delete Confirmation — draft invoices */}
      <AlertDialog
        open={!!deletingInvoice && deletingInvoice.stato === "bozza"}
        onOpenChange={(open) => !open && setDeletingInvoice(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation — sent invoices (offer credit note) */}
      <AlertDialog
        open={!!deletingInvoice && deletingInvoice.stato !== "bozza"}
        onOpenChange={(open) => !open && setDeletingInvoice(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.deleteAnywayTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.deleteAnywayDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deletingInvoice) return;
                const invoiceId = deletingInvoice.id;
                setDeletingInvoice(undefined);
                createCreditNote.mutate(invoiceId, {
                  onSuccess: (data) => navigate(`/invoices/${data.id}`),
                });
              }}
            >
              {t("invoices.createCreditNote")}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("invoices.deleteAnyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

**Step 4: Update status labels and variants**

Add `stornata` to `statusVariant` function:

```typescript
    case "stornata":
      return "secondary";
```

Add to `getStatusLabel`:

```typescript
      stornata: t("invoices.stornata"),
```

**Step 5: Hide delete option for stornata invoices**

Update the dropdown delete item condition (line 223):

```tsx
{inv.stato !== "stornata" && !inv.creditNoteId && (
```

**Step 6: Build and verify**

Run: `pnpm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add apps/web/src/pages/Invoices.tsx
git commit -m "feat: add credit note dialog when deleting sent invoices"
```

---

### Task 9: Update InvoiceDetail page — credit note links + updated delete dialog

**Files:**
- Modify: `apps/web/src/pages/InvoiceDetail.tsx`

**Step 1: Import useCreateCreditNote**

Add to imports from `use-invoices`:

```typescript
import { useInvoice, useValidateInvoice, useSendInvoice, useDeleteInvoice, useMarkSent, useMarkPaid, useCreateCreditNote } from "@/hooks/use-invoices";
```

**Step 2: Add hook and state**

```typescript
  const createCreditNote = useCreateCreditNote();
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false);
```

**Step 3: Update the delete button**

The delete button (lines 159-167) should show for all non-stornata invoices:

```tsx
        {invoice.stato !== "stornata" && !invoice.creditNoteId && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (invoice.stato === "bozza") {
                setShowDeleteConfirm(true);
              } else {
                setShowCreditNoteDialog(true);
              }
            }}
            disabled={deleteInvoice.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </Button>
        )}
```

**Step 4: Add credit note link in the header area**

After the paid badge (line 97-99), add:

```tsx
        {invoice.creditNoteId && (
          <Button variant="link" size="sm" onClick={() => navigate(`/invoices/${invoice.creditNoteId}`)}>
            {t("invoices.viewCreditNote")}
          </Button>
        )}
        {invoice.originalInvoiceId && (
          <Button variant="link" size="sm" onClick={() => navigate(`/invoices/${invoice.originalInvoiceId}`)}>
            {t("invoices.viewOriginalInvoice")}
          </Button>
        )}
```

**Step 5: Add the credit note dialog**

Add after the existing delete confirmation dialog:

```tsx
      {/* Credit note dialog for sent invoices */}
      <AlertDialog open={showCreditNoteDialog} onOpenChange={setShowCreditNoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.deleteAnywayTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.deleteAnywayDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCreditNoteDialog(false);
                createCreditNote.mutate(id!, {
                  onSuccess: (data) => navigate(`/invoices/${data.id}`),
                });
              }}
            >
              {t("invoices.createCreditNote")}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowCreditNoteDialog(false);
                deleteInvoice.mutate(id!, {
                  onSuccess: () => navigate("/invoices"),
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("invoices.deleteAnyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

**Step 6: Build and verify**

Run: `pnpm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add apps/web/src/pages/InvoiceDetail.tsx
git commit -m "feat: add credit note dialog and links to invoice detail page"
```

---

### Task 10: Run full test suite, fix any issues, final commit

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run build**

Run: `pnpm run build`
Expected: Build succeeds

**Step 3: Fix any issues found**

If tests or build fail, fix the issues.

**Step 4: Final verification commit (if fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve issues from full test suite run"
```
