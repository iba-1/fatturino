import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";

/**
 * SDI routes — placeholder for Phase 3.
 * Will handle: send to SDI, webhook callbacks, status tracking.
 */
export async function sdiRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  // TODO Phase 3: POST /api/sdi/send/:invoiceId — send invoice to SDI via Invoicetronic
  // TODO Phase 3: POST /api/sdi/webhook — receive SDI status updates (no auth required)
  // TODO Phase 3: GET /api/sdi/status/:invoiceId — check SDI delivery status
}
