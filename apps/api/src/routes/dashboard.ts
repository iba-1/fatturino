import type { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import {
  calcolaImposta,
  calcolaInps,
  calcolaAccontoSaldo,
} from "@fatturino/shared";
import { db } from "../db/index.js";
import { invoices, userProfiles, clients } from "../db/schema.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

interface DashboardInvoice {
  totaleDocumento: string;
  stato: string;
  dataEmissione: Date;
}

interface DashboardProfile {
  codiceAteco: string;
  annoInizioAttivita: number;
  gestioneInps: string;
}

interface AggregateInput {
  invoices: DashboardInvoice[];
  profile: DashboardProfile | null;
  anno: number;
}

export function aggregateDashboardData(input: AggregateInput) {
  const { invoices: invs, profile, anno } = input;

  const nonDraft = invs.filter((i) => i.stato !== "bozza");
  const drafts = invs.filter((i) => i.stato === "bozza");

  const totalRevenue = nonDraft.reduce(
    (sum, i) => sum + parseFloat(String(i.totaleDocumento)),
    0
  );
  const invoicesSent = nonDraft.length;
  const pendingInvoices = drafts.length;

  // Monthly revenue (non-draft only)
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: 0,
  }));

  for (const inv of nonDraft) {
    const date = new Date(inv.dataEmissione);
    const month = date.getMonth(); // 0-indexed
    monthlyRevenue[month].revenue += parseFloat(String(inv.totaleDocumento));
  }

  for (const m of monthlyRevenue) {
    m.revenue = Math.round(m.revenue * 100) / 100;
  }

  const profileIncomplete =
    !profile || !profile.codiceAteco || !profile.annoInizioAttivita;

  let tax = null;
  let inps = null;
  let f24 = null;

  if (!profileIncomplete && profile) {
    try {
      const inpsResult = calcolaInps({
        fatturato: totalRevenue,
        codiceAteco: profile.codiceAteco,
        gestione: profile.gestioneInps as
          | "separata"
          | "artigiani"
          | "commercianti",
      });

      inps = {
        gestione: profile.gestioneInps,
        baseImponibile: inpsResult.baseImponibile,
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

      const f24Result = calcolaAccontoSaldo({
        impostaDovuta: taxResult.impostaDovuta,
        accontiVersati: 0,
        anno,
      });

      f24 = {
        primoAcconto: f24Result.primoAcconto,
        secondoAcconto: f24Result.secondoAcconto,
        saldo: f24Result.saldo,
      };
    } catch {
      tax = null;
      inps = null;
      f24 = null;
    }
  }

  return {
    anno,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    invoicesSent,
    pendingInvoices,
    monthlyRevenue,
    tax,
    inps,
    f24,
    profileIncomplete: profileIncomplete || tax === null,
  };
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get<{ Querystring: { anno?: string } }>(
    "/api/dashboard/summary",
    async (request) => {
      const userId = getUserId(request);
      const anno = request.query.anno
        ? parseInt(request.query.anno, 10)
        : new Date().getFullYear();

      const yearInvoices = await db
        .select({
          totaleDocumento: invoices.totaleDocumento,
          stato: invoices.stato,
          dataEmissione: invoices.dataEmissione,
        })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), eq(invoices.anno, anno)));

      const recentInvoices = await db
        .select({
          id: invoices.id,
          numeroFattura: invoices.numeroFattura,
          dataEmissione: invoices.dataEmissione,
          totaleDocumento: invoices.totaleDocumento,
          stato: invoices.stato,
          clientRagioneSociale: clients.ragioneSociale,
          clientNome: clients.nome,
          clientCognome: clients.cognome,
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(eq(invoices.userId, userId))
        .orderBy(sql`${invoices.dataEmissione} DESC`)
        .limit(5);

      const profiles = await db
        .select({
          codiceAteco: userProfiles.codiceAteco,
          annoInizioAttivita: userProfiles.annoInizioAttivita,
          gestioneInps: userProfiles.gestioneInps,
        })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId));

      const profile = profiles.length > 0 ? profiles[0] : null;

      const summary = aggregateDashboardData({
        invoices: yearInvoices,
        profile,
        anno,
      });

      return {
        ...summary,
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          numeroFattura: inv.numeroFattura,
          dataEmissione: inv.dataEmissione,
          totaleDocumento: parseFloat(String(inv.totaleDocumento)),
          stato: inv.stato,
          clientName:
            inv.clientRagioneSociale ||
            [inv.clientNome, inv.clientCognome].filter(Boolean).join(" ") ||
            "—",
        })),
      };
    }
  );
}
