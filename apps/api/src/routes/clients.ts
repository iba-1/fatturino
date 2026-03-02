import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { createClientSchema } from "@fatturino/shared";
import { db } from "../db/index.js";
import { clients } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

export async function clientRoutes(app: FastifyInstance) {
  // All client routes require auth
  app.addHook("preHandler", requireAuth);

  // List clients
  app.get("/api/clients", async (request) => {
    const userId = getUserId(request);
    const result = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(clients.ragioneSociale);
    return result;
  });

  // Get single client
  app.get<{ Params: { id: string } }>("/api/clients/:id", async (request, reply) => {
    const userId = getUserId(request);
    const result = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, request.params.id), eq(clients.userId, userId)));

    if (result.length === 0) {
      return reply.status(404).send({ error: "Client not found" });
    }
    return result[0];
  });

  // Create client
  app.post("/api/clients", async (request, reply) => {
    const userId = getUserId(request);
    const parsed = createClientSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const [created] = await db
      .insert(clients)
      .values({
        userId,
        tipo: parsed.data.tipo,
        ragioneSociale: parsed.data.ragioneSociale,
        nome: parsed.data.nome,
        cognome: parsed.data.cognome,
        partitaIva: parsed.data.partitaIva,
        codiceFiscale: parsed.data.codiceFiscale,
        codiceSdi: parsed.data.codiceSdi,
        pec: parsed.data.pec,
        indirizzo: parsed.data.indirizzo,
        cap: parsed.data.cap,
        citta: parsed.data.citta,
        provincia: parsed.data.provincia,
        nazione: parsed.data.nazione,
      })
      .returning();

    return reply.status(201).send(created);
  });

  // Update client
  app.put<{ Params: { id: string } }>("/api/clients/:id", async (request, reply) => {
    const userId = getUserId(request);
    const parsed = createClientSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const [updated] = await db
      .update(clients)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, request.params.id), eq(clients.userId, userId)))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Client not found" });
    }
    return updated;
  });

  // Delete client
  app.delete<{ Params: { id: string } }>("/api/clients/:id", async (request, reply) => {
    const userId = getUserId(request);
    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, request.params.id), eq(clients.userId, userId)))
      .returning();

    if (!deleted) {
      return reply.status(404).send({ error: "Client not found" });
    }
    return { success: true };
  });
}
