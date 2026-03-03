import type { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import { createInvoiceSchema, updateInvoiceSchema, SOGLIA_BOLLO, IMPORTO_BOLLO } from "@fatturino/shared";
import { buildFatturaXml, validateBusinessRules } from "@fatturino/fattura-xml";
import { db } from "../db/index.js";
import { invoices, invoiceLines, userProfiles, clients } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";
import { mapToFatturaInput } from "../services/fattura-mapper.js";
import { renderInvoiceHtml } from "../services/pdf/invoice-template.js";
import { generatePdf } from "../services/pdf/pdf-generator.js";
import { DISCLAIMER_FORFETTARIO } from "@fatturino/shared";

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

  // Update draft invoice
  app.put<{ Params: { id: string } }>("/api/invoices/:id", async (request, reply) => {
    const userId = getUserId(request);
    const parsed = updateInvoiceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

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

    const imponibile = lines.reduce(
      (sum, line) => sum + line.quantita * line.prezzoUnitario, 0
    );
    const imponibileRounded = Math.round(imponibile * 100) / 100;
    const impostaBollo = imponibileRounded > SOGLIA_BOLLO ? IMPORTO_BOLLO : 0;
    const totaleDocumento = imponibileRounded + impostaBollo;

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
        xmlContent: null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, request.params.id))
      .returning();

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

  // Validate invoice for XML generation
  app.get<{ Params: { id: string } }>("/api/invoices/:id/xml/validate", async (request, reply) => {
    const userId = getUserId(request);

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    if (profiles.length === 0) {
      return reply.status(400).send({ error: "Profilo utente non completato", code: "MISSING_PROFILE" });
    }

    const invoice = await db.select().from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));
    if (invoice.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, request.params.id));
    const clientRows = await db.select().from(clients).where(eq(clients.id, invoice[0].clientId));

    const input = mapToFatturaInput(profiles[0], clientRows[0], invoice[0], lines);
    const errors = validateBusinessRules(input);

    return { valid: errors.length === 0, errors };
  });

  // Generate and download XML
  app.get<{ Params: { id: string } }>("/api/invoices/:id/xml", async (request, reply) => {
    const userId = getUserId(request);

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    if (profiles.length === 0) {
      return reply.status(400).send({ error: "Profilo utente non completato", code: "MISSING_PROFILE" });
    }

    const invoice = await db.select().from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));
    if (invoice.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, request.params.id));
    const clientRows = await db.select().from(clients).where(eq(clients.id, invoice[0].clientId));

    const input = mapToFatturaInput(profiles[0], clientRows[0], invoice[0], lines);

    const errors = validateBusinessRules(input);
    if (errors.length > 0) {
      return reply.status(422).send({ error: "Validation failed", errors });
    }

    const xml = buildFatturaXml(input);

    // Store XML in DB
    await db.update(invoices).set({ xmlContent: xml }).where(eq(invoices.id, request.params.id));

    const filename = `IT${profiles[0].partitaIva}_${invoice[0].numeroFattura.toString().padStart(5, "0")}.xml`;

    return reply
      .header("Content-Type", "application/xml")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(xml);
  });

  // Generate and download PDF
  app.get<{ Params: { id: string } }>("/api/invoices/:id/pdf", async (request, reply) => {
    const userId = getUserId(request);

    const profiles = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    if (profiles.length === 0) {
      return reply.status(400).send({ error: "Profilo utente non completato", code: "MISSING_PROFILE" });
    }

    const invoice = await db.select().from(invoices)
      .where(and(eq(invoices.id, request.params.id), eq(invoices.userId, userId)));
    if (invoice.length === 0) {
      return reply.status(404).send({ error: "Invoice not found" });
    }

    const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, request.params.id));
    const clientRows = await db.select().from(clients).where(eq(clients.id, invoice[0].clientId));
    const client = clientRows[0];
    const inv = invoice[0];

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

    const pdf = await generatePdf(html);

    const filename = `Fattura_${inv.numeroFattura}_${inv.anno}.pdf`;

    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(pdf);
  });
}
