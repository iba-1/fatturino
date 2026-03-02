import type { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import { createInvoiceSchema, SOGLIA_BOLLO, IMPORTO_BOLLO } from "@fatturino/shared";
import { db } from "../db/index.js";
import { invoices, invoiceLines } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

export async function invoiceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  // List invoices
  app.get("/api/invoices", async (request) => {
    const userId = getUserId(request);
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(invoices.anno, invoices.numeroFattura);
    return result;
  });

  // Get single invoice with lines
  app.get<{ Params: { id: string } }>("/api/invoices/:id", async (request, reply) => {
    const userId = getUserId(request);
    const invoice = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));

    if (invoice.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    const lines = await db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, request.params.id));

    return { ...invoice[0], lines };
  });

  // Create invoice
  app.post("/api/invoices", async (request, reply) => {
    const userId = getUserId(request);
    const parsed = createInvoiceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const { lines, ...invoiceData } = parsed.data;

    // Calculate totals
    const imponibile = lines.reduce(
      (sum, line) => sum + line.quantita * line.prezzoUnitario,
      0
    );
    const imponibileRounded = Math.round(imponibile * 100) / 100;

    // Auto-apply bollo for forfettari invoices > €77.47
    const impostaBollo = imponibileRounded > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
    const totaleDocumento = imponibileRounded + impostaBollo;

    // Get next invoice number for this user and year
    const anno = new Date(invoiceData.dataEmissione).getFullYear();
    const maxNumero = await db
      .select({ max: sql<number>`COALESCE(MAX(${invoices.numeroFattura}), 0)` })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.anno, anno)));

    const numeroFattura = (maxNumero[0]?.max || 0) + 1;

    // Insert invoice
    const [created] = await db
      .insert(invoices)
      .values({
        userId,
        clientId: invoiceData.clientId,
        numeroFattura,
        anno,
        dataEmissione: new Date(invoiceData.dataEmissione),
        tipoDocumento: invoiceData.tipoDocumento,
        causale: invoiceData.causale ?? null,
        imponibile: imponibileRounded.toString(),
        impostaBollo: impostaBollo.toString(),
        totaleDocumento: totaleDocumento.toString(),
        stato: "bozza",
      })
      .returning();

    // Insert lines
    const lineValues = lines.map((line) => ({
      invoiceId: created.id,
      descrizione: line.descrizione,
      quantita: line.quantita.toString(),
      prezzoUnitario: line.prezzoUnitario.toString(),
      prezzoTotale: (Math.round(line.quantita * line.prezzoUnitario * 100) / 100).toString(),
      aliquotaIva: (line.aliquotaIva ?? 0).toString(),
      naturaIva: line.naturaIva ?? "N2.2",
    }));

    const createdLines = await db.insert(invoiceLines).values(lineValues).returning();

    return reply.status(201).send({ ...created, lines: createdLines });
  });

  // Delete draft invoice
  app.delete<{ Params: { id: string } }>("/api/invoices/:id", async (request, reply) => {
    const userId = getUserId(request);

    // Only allow deleting drafts
    const existing = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));

    if (existing.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    if (existing[0].stato !== "bozza") {
      return reply.status(400).send({ error: "Only draft invoices can be deleted" });
    }

    await db.delete(invoices).where(eq(invoices.id, request.params.id));
    return { success: true };
  });
}
