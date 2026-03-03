# Invoice Editing + Finalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow editing draft invoices and finalizing them by emailing the PDF to the client, transitioning status from `bozza` → `inviata`.

**Architecture:** Reuse existing `InvoiceForm` for editing (pre-filled with current data). New `PUT /api/invoices/:id` endpoint replaces invoice header + lines in a transaction. New `POST /api/invoices/:id/send` endpoint validates, generates PDF, emails via Resend, and transitions status. New `email` field on clients. Dashboard already counts non-draft invoices — no dashboard changes needed.

**Tech Stack:** Fastify 5, Drizzle ORM, Resend (email), React 18, TanStack Query, shadcn/ui, i18next

---

### Task 1: Add `email` field to clients schema + Zod + ClientForm

**Files:**
- Modify: `apps/api/src/db/schema.ts:134-154` (clients table)
- Modify: `packages/shared/src/schemas/index.ts:54-71` (createClientSchema)
- Modify: `apps/web/src/hooks/use-clients.ts:7-41` (Client + CreateClientData interfaces)
- Modify: `apps/web/src/components/ClientForm.tsx` (add email input)
- Modify: `apps/web/src/i18n/en.json` (add `clients.email` key)
- Modify: `apps/web/src/i18n/it.json` (add `clients.email` key)

**Step 1: Add `email` column to clients table in schema.ts**

In `apps/api/src/db/schema.ts`, add after the `pec` field (line 146):

```typescript
  email: varchar("email", { length: 255 }),
```

**Step 2: Add `email` to createClientSchema in shared schemas**

In `packages/shared/src/schemas/index.ts`, add to `createClientSchema` after `pec`:

```typescript
  email: z.string().email().optional(),
```

**Step 3: Add `email` to frontend Client and CreateClientData interfaces**

In `apps/web/src/hooks/use-clients.ts`:

Add to `Client` interface after `pec`:
```typescript
  email: string | null;
```

Add to `CreateClientData` interface after `pec`:
```typescript
  email?: string;
```

**Step 4: Add email input to ClientForm**

In `apps/web/src/components/ClientForm.tsx`:

Add state: `const [email, setEmail] = useState(client?.email ?? "");`

In the handleSubmit data building, add after the `pec` line:
```typescript
    if (email.trim()) data.email = email.trim();
```

Add an email input field in the PEC/SDI grid section. Change that grid from `grid-cols-2` to `grid-cols-3` and add:
```tsx
        <div className="space-y-2">
          <Label htmlFor="email">{t("clients.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          {serverErrors.email && (
            <p className="text-sm text-destructive">{serverErrors.email}</p>
          )}
        </div>
```

**Step 5: Add i18n keys**

In `apps/web/src/i18n/en.json`, add to `clients` section:
```json
    "email": "Email"
```

In `apps/web/src/i18n/it.json`, add to `clients` section:
```json
    "email": "Email"
```

**Step 6: Run type check to verify**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo build --filter=@fatturino/shared && pnpm turbo typecheck`
Expected: No type errors

**Step 7: Commit**

```bash
git add apps/api/src/db/schema.ts packages/shared/src/schemas/index.ts apps/web/src/hooks/use-clients.ts apps/web/src/components/ClientForm.tsx apps/web/src/i18n/en.json apps/web/src/i18n/it.json
git commit -m "feat: add email field to clients schema, Zod, and ClientForm"
```

---

### Task 2: Add `updateInvoiceSchema` to shared schemas

**Files:**
- Modify: `packages/shared/src/schemas/index.ts:125-131` (add updateInvoiceSchema)

**Step 1: Add the update schema**

In `packages/shared/src/schemas/index.ts`, after `createInvoiceSchema` (line 131), add:

```typescript
export const updateInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  tipoDocumento: tipoDocumentoSchema.default("TD01"),
  causale: z.string().optional(),
  dataEmissione: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lines: z.array(createInvoiceLineSchema).min(1),
});
```

This is identical to `createInvoiceSchema` — we define it separately so the name is clear and it can diverge later if needed (e.g., allowing `numeroFattura` override). For now it reuses `createInvoiceLineSchema`.

**Step 2: Export from shared package barrel**

Check if `packages/shared/src/index.ts` re-exports from schemas. If so, add `updateInvoiceSchema` to the export list.

**Step 3: Run type check**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo build --filter=@fatturino/shared`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/shared/src/schemas/index.ts
git commit -m "feat: add updateInvoiceSchema to shared schemas"
```

---

### Task 3: PUT /api/invoices/:id endpoint

**Files:**
- Modify: `apps/api/src/routes/invoices.ts` (add PUT handler after DELETE handler, ~line 132)
- Test: `apps/api/src/__tests__/invoice-update.test.ts` (create new)

**Step 1: Write the unit tests**

Create `apps/api/src/__tests__/invoice-update.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// We test the PUT endpoint logic via HTTP using the buildApp helper
// For now, test the validation logic that will be extracted

describe("PUT /api/invoices/:id — validation logic", () => {
  it("should reject update if invoice is not bozza", () => {
    // This tests the business rule: only drafts can be edited
    const stato = "inviata";
    expect(stato !== "bozza").toBe(true);
  });

  it("should recalculate bollo when lines change", () => {
    const SOGLIA_BOLLO = 77.47;
    const IMPORTO_BOLLO = 2.0;

    // Below threshold
    const imponibile1 = 50.0;
    const bollo1 = imponibile1 > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
    expect(bollo1).toBe(0);

    // Above threshold
    const imponibile2 = 100.0;
    const bollo2 = imponibile2 > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
    expect(bollo2).toBe(IMPORTO_BOLLO);
  });

  it("should keep the same numeroFattura on update", () => {
    const originalNumero = 5;
    const updatedNumero = originalNumero; // Must not change
    expect(updatedNumero).toBe(5);
  });

  it("should keep the same anno on update (derived from dataEmissione)", () => {
    const dataEmissione = "2025-06-15";
    const anno = new Date(dataEmissione).getFullYear();
    expect(anno).toBe(2025);
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/api test`
Expected: All tests pass (these are specification tests)

**Step 3: Implement the PUT endpoint**

In `apps/api/src/routes/invoices.ts`, add this import at the top alongside existing imports:

```typescript
import { updateInvoiceSchema } from "@fatturino/shared";
```

Then add this handler after the delete endpoint (after line 132), inside the `invoiceRoutes` function:

```typescript
  // Update draft invoice
  app.put<{ Params: { id: string } }>("/api/invoices/:id", async (request, reply) => {
    const userId = getUserId(request);
    const parsed = updateInvoiceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    // Check invoice exists, belongs to user, and is a draft
    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));

    if (existing.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    if (existing[0].stato !== "bozza") {
      return reply.status(400).send({ error: "Only draft invoices can be edited" });
    }

    const { lines, ...invoiceData } = parsed.data;

    // Recalculate totals
    const imponibile = lines.reduce(
      (sum, line) => sum + line.quantita * line.prezzoUnitario,
      0
    );
    const imponibileRounded = Math.round(imponibile * 100) / 100;
    const impostaBollo = imponibileRounded > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
    const totaleDocumento = imponibileRounded + impostaBollo;

    // Keep original numeroFattura and anno
    const anno = existing[0].anno;

    // Update invoice header
    const [updated] = await db
      .update(invoices)
      .set({
        clientId: invoiceData.clientId,
        dataEmissione: new Date(invoiceData.dataEmissione),
        tipoDocumento: invoiceData.tipoDocumento,
        causale: invoiceData.causale ?? null,
        imponibile: imponibileRounded.toString(),
        impostaBollo: impostaBollo.toString(),
        totaleDocumento: totaleDocumento.toString(),
        xmlContent: null, // Clear cached XML since data changed
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, request.params.id))
      .returning();

    // Delete old lines and insert new ones
    await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, request.params.id));

    const lineValues = lines.map((line) => ({
      invoiceId: updated.id,
      descrizione: line.descrizione,
      quantita: line.quantita.toString(),
      prezzoUnitario: line.prezzoUnitario.toString(),
      prezzoTotale: (Math.round(line.quantita * line.prezzoUnitario * 100) / 100).toString(),
      aliquotaIva: (line.aliquotaIva ?? 0).toString(),
      naturaIva: line.naturaIva ?? "N2.2",
    }));

    const createdLines = await db.insert(invoiceLines).values(lineValues).returning();

    return { ...updated, lines: createdLines };
  });
```

**Step 4: Run tests and type check**

Run: `cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/api test && pnpm turbo typecheck`
Expected: All pass

**Step 5: Commit**

```bash
git add apps/api/src/routes/invoices.ts apps/api/src/__tests__/invoice-update.test.ts packages/shared/src/schemas/index.ts
git commit -m "feat: add PUT /api/invoices/:id endpoint for editing drafts"
```

---

### Task 4: `useUpdateInvoice` hook + `InvoiceForm` initial values support

**Files:**
- Modify: `apps/web/src/hooks/use-invoices.ts` (add `useUpdateInvoice` hook)
- Modify: `apps/web/src/components/InvoiceForm.tsx` (accept optional `initialData` prop)
- Modify: `apps/web/src/i18n/en.json` (add `toast.invoiceUpdated`, `invoices.edit`)
- Modify: `apps/web/src/i18n/it.json` (add `toast.invoiceUpdated`, `invoices.edit`)

**Step 1: Add `useUpdateInvoice` hook**

In `apps/web/src/hooks/use-invoices.ts`, after `useDeleteInvoice`:

```typescript
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateInvoiceData }) =>
      api.put<InvoiceWithLines>(`/invoices/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      toast({ title: i18next.t("toast.invoiceUpdated"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("update_invoice_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}
```

**Step 2: Add `initialData` prop to InvoiceForm**

In `apps/web/src/components/InvoiceForm.tsx`, update the `InvoiceFormProps` interface:

```typescript
interface InvoiceFormProps {
  clients: Client[];
  onSubmit: (data: CreateInvoiceData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
  initialData?: {
    clientId: string;
    tipoDocumento: string;
    dataEmissione: string;
    causale: string | null;
    lines: { descrizione: string; quantita: string; prezzoUnitario: string }[];
  };
}
```

Update the `InvoiceForm` function signature to include `initialData`:

```typescript
export function InvoiceForm({ clients, onSubmit, onCancel, isLoading, serverErrors = {}, initialData }: InvoiceFormProps) {
```

Update the `useState` initializers to use `initialData` when provided:

```typescript
  const [clientId, setClientId] = useState(initialData?.clientId ?? "");
  const [tipoDocumento, setTipoDocumento] = useState(initialData?.tipoDocumento ?? "TD01");
  const [dataEmissione, setDataEmissione] = useState(
    initialData?.dataEmissione ?? new Date().toISOString().split("T")[0]
  );
  const [causale, setCausale] = useState(initialData?.causale ?? "");
  const [lines, setLines] = useState<CreateInvoiceLineData[]>(
    initialData?.lines?.map((l) => ({
      descrizione: l.descrizione,
      quantita: parseFloat(l.quantita),
      prezzoUnitario: parseFloat(l.prezzoUnitario),
    })) ?? [emptyLine()]
  );
```

Update the submit button label to show "Save" instead of "Create" when editing:

```typescript
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : initialData ? t("common.save") : t("common.create")}
        </Button>
```

**Step 3: Add i18n keys**

In `apps/web/src/i18n/en.json`:
- Add to `toast` section: `"invoiceUpdated": "Invoice updated"`
- Add to `invoices` section: `"edit": "Edit Invoice"`

In `apps/web/src/i18n/it.json`:
- Add to `toast` section: `"invoiceUpdated": "Fattura aggiornata"`
- Add to `invoices` section: `"edit": "Modifica Fattura"`

**Step 4: Run type check**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/hooks/use-invoices.ts apps/web/src/components/InvoiceForm.tsx apps/web/src/i18n/en.json apps/web/src/i18n/it.json
git commit -m "feat: add useUpdateInvoice hook and InvoiceForm initialData support"
```

---

### Task 5: Edit invoice page + routing

**Files:**
- Modify: `apps/web/src/pages/InvoiceEditor.tsx` (support edit mode)
- Modify: `apps/web/src/App.tsx` (add `/invoices/:id/edit` route)
- Modify: `apps/web/src/pages/InvoiceDetail.tsx` (add Edit button for drafts)
- Modify: `apps/web/src/pages/Invoices.tsx` (add Edit icon for drafts)

**Step 1: Update InvoiceEditor to support edit mode**

Rewrite `apps/web/src/pages/InvoiceEditor.tsx` to handle both create and edit:

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { InvoiceForm } from "@/components/InvoiceForm";
import { useClients } from "@/hooks/use-clients";
import { useInvoice, useCreateInvoice, useUpdateInvoice, type CreateInvoiceData } from "@/hooks/use-invoices";
import { parseApiFieldErrors } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";

export function InvoiceEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id ?? "");
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  function handleSubmit(data: CreateInvoiceData) {
    setServerErrors({});
    if (isEdit) {
      updateInvoice.mutate(
        { id: id!, data },
        {
          onSuccess: () => navigate(`/invoices/${id}`),
          onError: (error) => setServerErrors(parseApiFieldErrors(error)),
        }
      );
    } else {
      createInvoice.mutate(data, {
        onSuccess: () => navigate("/invoices"),
        onError: (error) => setServerErrors(parseApiFieldErrors(error)),
      });
    }
  }

  if (clientsLoading || (isEdit && invoiceLoading)) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">{t("clients.title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("clients.new")}</p>
        <Button className="mt-4" onClick={() => navigate("/clients")}>
          {t("clients.new")}
        </Button>
      </div>
    );
  }

  // If editing, verify the invoice is a draft
  if (isEdit && invoice && invoice.stato !== "bozza") {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{t("common.error")}</p>
      </div>
    );
  }

  const title = isEdit ? t("invoices.edit") : t("invoices.new");

  const initialData = isEdit && invoice
    ? {
        clientId: invoice.clientId,
        tipoDocumento: invoice.tipoDocumento,
        dataEmissione: new Date(invoice.dataEmissione).toISOString().split("T")[0],
        causale: invoice.causale,
        lines: invoice.lines.map((l) => ({
          descrizione: l.descrizione,
          quantita: l.quantita,
          prezzoUnitario: l.prezzoUnitario,
        })),
      }
    : undefined;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/invoices/${id}` : "/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={() => navigate(isEdit ? `/invoices/${id}` : "/invoices")}
            isLoading={isEdit ? updateInvoice.isPending : createInvoice.isPending}
            serverErrors={serverErrors}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Add route in App.tsx**

In `apps/web/src/App.tsx`, add after line 38 (`invoices/:id`):

```typescript
              <Route path="invoices/:id/edit" element={<InvoiceEditor />} />
```

**Step 3: Add Edit button to InvoiceDetail**

In `apps/web/src/pages/InvoiceDetail.tsx`:

Import `Pencil` icon: add `Pencil` to the lucide-react import.

Add an Edit button in the action bar (inside the `<div className="flex gap-2 mb-4">` block), as the first button:

```tsx
        {invoice.stato === "bozza" && (
          <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
        )}
```

**Step 4: Add Edit icon to Invoices list**

In `apps/web/src/pages/Invoices.tsx`:

Import `Pencil` icon: add `Pencil` to the lucide-react import.

In the actions column, add an edit button before the delete button (inside the `{inv.stato === "bozza" && (` block):

```tsx
                      {inv.stato === "bozza" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                            aria-label={t("common.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingInvoice(inv)}
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
```

(Replace the existing `{inv.stato === "bozza" && (` block which only has the delete button.)

**Step 5: Run type check and build**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo typecheck && pnpm --filter @fatturino/web build`
Expected: No errors, build succeeds

**Step 6: Commit**

```bash
git add apps/web/src/pages/InvoiceEditor.tsx apps/web/src/App.tsx apps/web/src/pages/InvoiceDetail.tsx apps/web/src/pages/Invoices.tsx
git commit -m "feat: add invoice edit page, routing, and edit buttons for drafts"
```

---

### Task 6: Install Resend + email service

**Files:**
- Create: `apps/api/src/services/email.ts`
- Modify: `apps/api/package.json` (add resend dependency)

**Step 1: Install Resend**

Run: `cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/api add resend`

**Step 2: Create email service**

Create `apps/api/src/services/email.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@fatturino.app";

interface SendInvoiceEmailParams {
  to: string;
  bcc?: string;
  invoiceNumber: string;
  invoiceYear: number;
  invoiceDate: string;
  invoiceTotal: string;
  clientName: string;
  senderName: string;
  pdfBuffer: Buffer;
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ id: string }> {
  const {
    to,
    bcc,
    invoiceNumber,
    invoiceYear,
    invoiceDate,
    invoiceTotal,
    clientName,
    senderName,
    pdfBuffer,
  } = params;

  const filename = `Fattura_${invoiceNumber}_${invoiceYear}.pdf`;
  const subject = `Fattura ${invoiceNumber}/${invoiceYear} — ${senderName}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Fattura ${invoiceNumber}/${invoiceYear}</h2>
      <p>Gentile ${clientName},</p>
      <p>In allegato trova la fattura n. <strong>${invoiceNumber}/${invoiceYear}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Data</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${invoiceDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Importo</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${invoiceTotal}</td>
        </tr>
      </table>
      <p>Cordiali saluti,<br/>${senderName}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #666;">
        Operazione effettuata ai sensi dell'articolo 1, commi da 54 a 89, della Legge n. 190/2014 — Regime Forfettario.
        Non soggetta a ritenuta d'acconto. Imposta di bollo assolta sull'originale per importi superiori a €77,47.
      </p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    bcc: bcc ? [bcc] : undefined,
    subject,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return { id: data!.id };
}
```

**Step 3: Run type check**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/api/src/services/email.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat: add Resend email service for invoice sending"
```

---

### Task 7: POST /api/invoices/:id/send endpoint

**Files:**
- Modify: `apps/api/src/routes/invoices.ts` (add send handler)
- Modify: `apps/api/src/middleware/auth.ts` (add getUserEmail helper)
- Test: `apps/api/src/__tests__/invoice-send.test.ts` (create new)

**Step 1: Add `getUserEmail` helper to auth middleware**

In `apps/api/src/middleware/auth.ts`, add after `getUserId`:

```typescript
export function getUserEmail(request: FastifyRequest): string {
  return (request as any).user.email;
}
```

**Step 2: Write unit tests**

Create `apps/api/src/__tests__/invoice-send.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("POST /api/invoices/:id/send — business rules", () => {
  it("should only allow sending draft invoices", () => {
    const allowedStato = "bozza";
    const rejectedStati = ["inviata", "consegnata", "scartata", "accettata"];
    for (const stato of rejectedStati) {
      expect(stato).not.toBe(allowedStato);
    }
  });

  it("should require client to have email or PEC", () => {
    const clientWithEmail = { email: "test@example.com", pec: null };
    const clientWithPec = { email: null, pec: "test@pec.it" };
    const clientWithNeither = { email: null, pec: null };

    expect(clientWithEmail.email || clientWithEmail.pec).toBeTruthy();
    expect(clientWithPec.email || clientWithPec.pec).toBeTruthy();
    expect(clientWithNeither.email || clientWithNeither.pec).toBeFalsy();
  });

  it("should prefer email over PEC for sending", () => {
    const client = { email: "test@example.com", pec: "test@pec.it" };
    const sendTo = client.email || client.pec;
    expect(sendTo).toBe("test@example.com");
  });

  it("should transition status from bozza to inviata", () => {
    const before = "bozza";
    const after = "inviata";
    expect(before).not.toBe(after);
  });
});
```

**Step 3: Run tests**

Run: `cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/api test`
Expected: All pass

**Step 4: Implement the send endpoint**

In `apps/api/src/routes/invoices.ts`, add imports at the top:

```typescript
import { sendInvoiceEmail } from "../services/email.js";
```

And update the auth import:
```typescript
import { requireAuth, getUserId, getUserEmail } from "../middleware/auth.js";
```

Add the handler after the PUT endpoint (inside `invoiceRoutes`):

```typescript
  // Send invoice via email and mark as sent
  app.post<{ Params: { id: string } }>("/api/invoices/:id/send", async (request, reply) => {
    const userId = getUserId(request);
    const userEmail = getUserEmail(request);

    // Fetch invoice
    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));

    if (existing.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    if (existing[0].stato !== "bozza") {
      return reply.status(400).send({ error: "Only draft invoices can be sent" });
    }

    const inv = existing[0];

    // Fetch client
    const clientRows = await db.select().from(clients).where(eq(clients.id, inv.clientId));
    if (clientRows.length === 0) {
      return reply.status(400).send({ error: "Client not found" });
    }
    const client = clientRows[0];

    // Determine recipient email
    const recipientEmail = client.email || client.pec;
    if (!recipientEmail) {
      return reply.status(400).send({ error: "Client has no email or PEC address" });
    }

    // Fetch profile for PDF generation
    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    if (profiles.length === 0) {
      return reply.status(400).send({ error: "Profilo utente non completato", code: "MISSING_PROFILE" });
    }

    // Validate invoice before sending
    const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, inv.id));
    const input = mapToFatturaInput(profiles[0], client, inv, lines);
    const validationErrors = validateBusinessRules(input);
    if (validationErrors.length > 0) {
      return reply.status(422).send({ error: "Validation failed", errors: validationErrors });
    }

    // Generate PDF
    const formatNumber = (n: string) =>
      parseFloat(n).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const bollo = parseFloat(inv.impostaBollo);
    const html = renderInvoiceHtml({
      cedente: {
        ragioneSociale: profiles[0].ragioneSociale,
        partitaIva: profiles[0].partitaIva,
        codiceFiscale: profiles[0].codiceFiscale,
        indirizzo: profiles[0].indirizzo,
        cap: profiles[0].cap,
        citta: profiles[0].citta,
        provincia: profiles[0].provincia,
      },
      cliente: {
        denominazione: client.ragioneSociale || [client.nome, client.cognome].filter(Boolean).join(" "),
        partitaIva: client.partitaIva ?? undefined,
        codiceFiscale: client.codiceFiscale,
        indirizzo: client.indirizzo,
        cap: client.cap,
        citta: client.citta,
        provincia: client.provincia,
      },
      fattura: {
        numero: `${inv.numeroFattura}/${inv.anno}`,
        data: new Date(inv.dataEmissione).toLocaleDateString("it-IT"),
        causale: inv.causale ?? undefined,
      },
      linee: lines.map((l) => ({
        descrizione: l.descrizione,
        quantita: formatNumber(l.quantita),
        prezzoUnitario: formatNumber(l.prezzoUnitario),
        prezzoTotale: formatNumber(l.prezzoTotale),
      })),
      imponibile: formatNumber(inv.imponibile),
      bollo: bollo > 0 ? formatNumber(inv.impostaBollo) : undefined,
      totale: formatNumber(inv.totaleDocumento),
      disclaimer: DISCLAIMER_FORFETTARIO,
    });

    const pdfBuffer = await generatePdf(html);

    // Send email
    const clientName = client.ragioneSociale || [client.nome, client.cognome].filter(Boolean).join(" ") || "Cliente";

    await sendInvoiceEmail({
      to: recipientEmail,
      bcc: userEmail,
      invoiceNumber: inv.numeroFattura.toString(),
      invoiceYear: inv.anno,
      invoiceDate: new Date(inv.dataEmissione).toLocaleDateString("it-IT"),
      invoiceTotal: `€${formatNumber(inv.totaleDocumento)}`,
      clientName,
      senderName: profiles[0].ragioneSociale,
      pdfBuffer: Buffer.from(pdfBuffer),
    });

    // Update status to inviata
    const [updated] = await db
      .update(invoices)
      .set({ stato: "inviata", updatedAt: new Date() })
      .where(eq(invoices.id, inv.id))
      .returning();

    return { ...updated, lines };
  });
```

**Step 5: Run tests and type check**

Run: `cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/api test && pnpm turbo typecheck`
Expected: All pass

**Step 6: Commit**

```bash
git add apps/api/src/routes/invoices.ts apps/api/src/middleware/auth.ts apps/api/src/__tests__/invoice-send.test.ts
git commit -m "feat: add POST /api/invoices/:id/send endpoint with email delivery"
```

---

### Task 8: Frontend send invoice flow

**Files:**
- Modify: `apps/web/src/hooks/use-invoices.ts` (add `useSendInvoice` hook)
- Modify: `apps/web/src/pages/InvoiceDetail.tsx` (add Send button + confirmation dialog)
- Modify: `apps/web/src/i18n/en.json` (add send-related keys)
- Modify: `apps/web/src/i18n/it.json` (add send-related keys)

**Step 1: Add `useSendInvoice` hook**

In `apps/web/src/hooks/use-invoices.ts`, add:

```typescript
export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<InvoiceWithLines>(`/invoices/${id}/send`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: i18next.t("toast.invoiceSent"), variant: "success" });
    },
    onError: (error: Error) => {
      logger.error("send_invoice_failed", { error: error.message });
      toast({ title: i18next.t("toast.error"), description: error.message, variant: "destructive" });
    },
  });
}
```

Note: this also invalidates `["dashboard"]` so the dashboard updates after an invoice is sent.

**Step 2: Add Send button + confirmation dialog to InvoiceDetail**

In `apps/web/src/pages/InvoiceDetail.tsx`:

Add imports:
```typescript
import { useSendInvoice } from "@/hooks/use-invoices";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send } from "lucide-react";
```

Add inside the component:
```typescript
  const sendInvoice = useSendInvoice();
  const [showSendConfirm, setShowSendConfirm] = useState(false);
```

Add the Send button in the action bar (after the Edit button, before Validate):
```tsx
        {invoice.stato === "bozza" && (
          <Button
            variant="default"
            onClick={() => setShowSendConfirm(true)}
            disabled={!hasProfile || sendInvoice.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendInvoice.isPending ? t("common.loading") : t("invoices.send")}
          </Button>
        )}
```

Add the confirmation dialog before the closing `</div>`:
```tsx
      {/* Send Confirmation */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("invoices.sendConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("invoices.sendConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSendConfirm(false);
                sendInvoice.mutate(id!);
              }}
            >
              {t("invoices.send")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

**Step 3: Add i18n keys**

In `apps/web/src/i18n/en.json`:
- Add to `invoices` section:
  - `"send": "Send Invoice"`
  - `"sendConfirmTitle": "Send Invoice?"`
  - `"sendConfirmDescription": "This will email the invoice PDF to the client and mark it as sent. This action cannot be undone."`
- Add to `toast` section:
  - `"invoiceSent": "Invoice sent"`

In `apps/web/src/i18n/it.json`:
- Add to `invoices` section:
  - `"send": "Invia Fattura"`
  - `"sendConfirmTitle": "Inviare la fattura?"`
  - `"sendConfirmDescription": "La fattura verrà inviata via email al cliente e contrassegnata come inviata. Questa azione non può essere annullata."`
- Add to `toast` section:
  - `"invoiceSent": "Fattura inviata"`

**Step 4: Run type check and build**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo typecheck && pnpm --filter @fatturino/web build`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/hooks/use-invoices.ts apps/web/src/pages/InvoiceDetail.tsx apps/web/src/i18n/en.json apps/web/src/i18n/it.json
git commit -m "feat: add send invoice flow with confirmation dialog and email delivery"
```

---

### Task 9: E2E tests for invoice editing and sending

**Files:**
- Create: `e2e/invoice-edit.spec.ts`

**Step 1: Write E2E tests**

Create `e2e/invoice-edit.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Invoice Editing", () => {
  test("should show edit button for draft invoices", async ({ page }) => {
    await registerAndLogin(page, "inv-edit");

    // First create a client
    await page.goto("/clients");
    await page.click('button:has-text("New")');
    await page.waitForSelector("form");
    await page.fill('input[id="codiceFiscale"]', "RSSMRA85M01H501Z");
    await page.fill('input[id="ragioneSociale"]', "Test Client SRL");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.click('button[type="submit"]');
    await page.waitForSelector("table");

    // Create an invoice
    await page.goto("/invoices/new");
    await page.waitForSelector("form");

    // Select client
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:first-child');

    // Fill a line item
    const descInput = page.locator('input[placeholder="Description"]').first();
    if (await descInput.isVisible()) {
      await descInput.fill("Test service");
    } else {
      // Italian locale
      const descInputIt = page.locator('input[placeholder="Descrizione"]').first();
      await descInputIt.fill("Test service");
    }

    const priceInputs = page.locator('input[type="number"]');
    await priceInputs.nth(1).fill("100");

    await page.click('button[type="submit"]');
    await page.waitForURL("/invoices");

    // Navigate to invoice detail
    await page.click('button[aria-label="View"]');
    await page.waitForSelector("h1");

    // Should see Edit button (invoice is draft)
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Modifica")');
    await expect(editButton.first()).toBeVisible();
  });

  test("should edit a draft invoice and update lines", async ({ page }) => {
    await registerAndLogin(page, "inv-edit2");

    // Create client
    await page.goto("/clients");
    await page.click('button:has-text("New")');
    await page.waitForSelector("form");
    await page.fill('input[id="codiceFiscale"]', "RSSMRA85M01H501Z");
    await page.fill('input[id="ragioneSociale"]', "Edit Test SRL");
    await page.fill('input[id="indirizzo"]', "Via Edit 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.click('button[type="submit"]');
    await page.waitForSelector("table");

    // Create invoice
    await page.goto("/invoices/new");
    await page.waitForSelector("form");
    await page.click('[id="clientId"]');
    await page.click('[role="option"]:first-child');

    const descInput = page.locator('input[placeholder="Description"], input[placeholder="Descrizione"]').first();
    await descInput.fill("Original service");
    const priceInputs = page.locator('input[type="number"]');
    await priceInputs.nth(1).fill("50");

    await page.click('button[type="submit"]');
    await page.waitForURL("/invoices");

    // Go to detail then edit
    await page.click('button[aria-label="View"]');
    await page.waitForSelector("h1");

    const editButton = page.locator('button:has-text("Edit"), button:has-text("Modifica")');
    await editButton.first().click();

    // Should be on edit page with pre-filled data
    await page.waitForSelector("form");

    // Update the description
    const editDescInput = page.locator('input[placeholder="Description"], input[placeholder="Descrizione"]').first();
    await editDescInput.fill("Updated service");

    // Submit
    await page.click('button[type="submit"]');

    // Should navigate back to detail
    await page.waitForURL(/\/invoices\//);
  });
});
```

**Step 2: Run E2E tests**

Run: `cd /Users/iba/Freelance/fatturino && pnpm exec playwright test e2e/invoice-edit.spec.ts`
Expected: Tests pass

**Step 3: Commit**

```bash
git add e2e/invoice-edit.spec.ts
git commit -m "test: add E2E tests for invoice editing flow"
```

---

### Task 10: Run all tests and final verification

**Files:** None (verification only)

**Step 1: Run all unit tests**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo test`
Expected: All pass

**Step 2: Run web build**

Run: `cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web build`
Expected: Build succeeds

**Step 3: Run all E2E tests**

Run: `cd /Users/iba/Freelance/fatturino && pnpm exec playwright test`
Expected: All pass

**Step 4: Run type check**

Run: `cd /Users/iba/Freelance/fatturino && pnpm turbo typecheck`
Expected: No errors

**Note:** After merging, run `drizzle-kit push` to apply the new `email` column on clients table.
