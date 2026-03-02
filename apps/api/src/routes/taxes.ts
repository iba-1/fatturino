import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { calcolaImposta, calcolaInps, calcolaAccontoSaldo } from "@fatturino/shared";
import { requireAuth } from "../middleware/auth.js";

const taxCalcSchema = z.object({
  fatturato: z.number().nonnegative(),
  codiceAteco: z.string().min(1),
  contributiInpsVersati: z.number().nonnegative(),
  annoInizioAttivita: z.number().int().min(1900),
  annoFiscale: z.number().int(),
});

const inpsCalcSchema = z.object({
  fatturato: z.number().nonnegative(),
  codiceAteco: z.string().min(1),
  gestione: z.enum(["separata", "artigiani", "commercianti"]),
});

export async function taxRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  // Calculate imposta sostitutiva
  app.post("/api/taxes/imposta", async (request, reply) => {
    const parsed = taxCalcSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    try {
      const result = calcolaImposta(parsed.data);
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Calculate INPS contributions
  app.post("/api/taxes/inps", async (request, reply) => {
    const parsed = inpsCalcSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    try {
      const result = calcolaInps(parsed.data);
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Calculate acconto/saldo breakdown
  app.post("/api/taxes/acconto-saldo", async (request, reply) => {
    const schema = z.object({
      impostaDovuta: z.number().nonnegative(),
      accontiVersati: z.number().nonnegative(),
      anno: z.number().int(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const result = calcolaAccontoSaldo(parsed.data);
    return result;
  });
}
