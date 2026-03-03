import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { calcolaImposta, calcolaInps, calcolaAccontoSaldo } from "@fatturino/shared";
import { db } from "../db/index.js";
import { invoices, userProfiles, taxPayments } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

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

// Deadline labels and their relative due dates (month/day in Italian tax calendar)
const DEADLINE_META = {
  primo_acconto: {
    label: "Primo Acconto",
    // Due June 30 of the same fiscal year
    getDueDate: (anno: number) => new Date(Date.UTC(anno, 5, 30)),
  },
  secondo_acconto: {
    label: "Secondo Acconto",
    // Due November 30 of the same fiscal year
    getDueDate: (anno: number) => new Date(Date.UTC(anno, 10, 30)),
  },
  saldo: {
    label: "Saldo",
    // Due June 30 of the following year
    getDueDate: (anno: number) => new Date(Date.UTC(anno + 1, 5, 30)),
  },
} as const;

type DeadlineType = keyof typeof DEADLINE_META;

function buildPaymentStatus(
  deadline: DeadlineType,
  amountDue: number,
  payment: { amountPaid: string | null; datePaid: string | null } | undefined,
  anno: number,
  now: Date
) {
  const dueDate = DEADLINE_META[deadline].getDueDate(anno);
  const amountPaid = payment?.amountPaid ? parseFloat(String(payment.amountPaid)) : 0;
  const isPaid = amountPaid > 0;
  const isOverdue = !isPaid && now > dueDate;

  return {
    deadline,
    label: DEADLINE_META[deadline].label,
    amountDue: Math.round(amountDue * 100) / 100,
    amountPaid,
    datePaid: payment?.datePaid ?? null,
    dueDate: dueDate.toISOString().slice(0, 10),
    status: isPaid ? "paid" : isOverdue ? "overdue" : "pending",
  };
}

export function buildTaxOverview(input: {
  anno: number;
  yearInvoices: Array<{ totaleDocumento: string; stato: string }>;
  profile: {
    codiceAteco: string;
    annoInizioAttivita: number;
    gestioneInps: string;
  } | null;
  payments: Array<{
    deadline: string;
    amountDue: string;
    amountPaid: string | null;
    datePaid: string | null;
  }>;
  now?: Date;
}) {
  const { anno, yearInvoices, profile, payments } = input;
  const now = input.now ?? new Date();

  const nonDraft = yearInvoices.filter((i) => i.stato !== "bozza");
  const totalRevenue =
    Math.round(
      nonDraft.reduce((sum, i) => sum + parseFloat(String(i.totaleDocumento)), 0) * 100
    ) / 100;

  const profileIncomplete =
    !profile || !profile.codiceAteco || !profile.annoInizioAttivita;

  // Build a lookup map for payments by deadline
  const paymentMap = new Map(payments.map((p) => [p.deadline, p]));

  let tax = null;
  let inps = null;
  let f24 = null;
  let paymentStatuses = null;

  if (!profileIncomplete && profile) {
    try {
      const inpsResult = calcolaInps({
        fatturato: totalRevenue,
        codiceAteco: profile.codiceAteco,
        gestione: profile.gestioneInps as "separata" | "artigiani" | "commercianti",
      });

      inps = {
        gestione: profile.gestioneInps,
        baseImponibile: inpsResult.baseImponibile,
        aliquota: inpsResult.aliquota,
        contributoFisso: inpsResult.contributoFisso,
        contributoEccedenza: inpsResult.contributoEccedenza,
        totaleDovuto: inpsResult.totaleDovuto,
      };

      const taxResult = calcolaImposta({
        fatturato: totalRevenue,
        codiceAteco: profile.codiceAteco,
        contributiInpsVersati: inpsResult.totaleDovuto,
        annoInizioAttivita: profile.annoInizioAttivita,
        annoFiscale: anno,
      });

      tax = {
        coefficienteRedditivita: taxResult.coefficienteRedditivita,
        redditoLordo: taxResult.redditoLordo,
        redditoImponibile: taxResult.redditoImponibile,
        aliquota: taxResult.aliquota,
        isStartup: taxResult.isStartup,
        impostaDovuta: taxResult.impostaDovuta,
      };

      // Sum of acconto payments (primo + secondo, not saldo) from actual payment records
      const accontiVersati = payments
        .filter((p) => p.deadline !== "saldo" && p.amountPaid)
        .reduce((sum, p) => sum + parseFloat(String(p.amountPaid)), 0);

      const f24Result = calcolaAccontoSaldo({
        impostaDovuta: taxResult.impostaDovuta,
        accontiVersati,
        anno,
      });

      f24 = {
        primoAcconto: f24Result.primoAcconto,
        secondoAcconto: f24Result.secondoAcconto,
        saldo: f24Result.saldo,
      };

      // Build payment statuses for all 3 deadlines using computed amounts
      const deadlines: DeadlineType[] = ["primo_acconto", "secondo_acconto", "saldo"];
      const amountDueByDeadline: Record<DeadlineType, number> = {
        primo_acconto: f24Result.primoAcconto,
        secondo_acconto: f24Result.secondoAcconto,
        saldo: f24Result.saldo,
      };

      paymentStatuses = deadlines.map((dl) =>
        buildPaymentStatus(
          dl,
          amountDueByDeadline[dl],
          paymentMap.get(dl) as
            | { amountPaid: string | null; datePaid: string | null }
            | undefined,
          anno,
          now
        )
      );
    } catch {
      tax = null;
      inps = null;
      f24 = null;
      paymentStatuses = null;
    }
  }

  return {
    anno,
    totalRevenue,
    tax,
    inps,
    f24,
    payments: paymentStatuses,
    profileIncomplete: profileIncomplete || tax === null,
  };
}

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

  // GET /api/taxes/overview?anno=YYYY
  app.get<{ Querystring: { anno?: string } }>(
    "/api/taxes/overview",
    async (request, reply) => {
      const userId = getUserId(request);

      const annoRaw = request.query.anno
        ? parseInt(request.query.anno, 10)
        : new Date().getFullYear();

      if (isNaN(annoRaw) || annoRaw < 1900 || annoRaw > 2100) {
        return reply.status(400).send({ error: "Invalid anno parameter" });
      }

      const anno = annoRaw;

      const [yearInvoices, profiles, payments] = await Promise.all([
        db
          .select({
            totaleDocumento: invoices.totaleDocumento,
            stato: invoices.stato,
          })
          .from(invoices)
          .where(and(eq(invoices.userId, userId), eq(invoices.anno, anno))),

        db
          .select({
            codiceAteco: userProfiles.codiceAteco,
            annoInizioAttivita: userProfiles.annoInizioAttivita,
            gestioneInps: userProfiles.gestioneInps,
          })
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId)),

        db
          .select({
            deadline: taxPayments.deadline,
            amountDue: taxPayments.amountDue,
            amountPaid: taxPayments.amountPaid,
            datePaid: taxPayments.datePaid,
          })
          .from(taxPayments)
          .where(and(eq(taxPayments.userId, userId), eq(taxPayments.anno, anno))),
      ]);

      const profile = profiles.length > 0 ? profiles[0] : null;

      const overview = buildTaxOverview({
        anno,
        yearInvoices,
        profile,
        payments,
      });

      return overview;
    }
  );
}
