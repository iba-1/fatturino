import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../lib/auth.js";
import { toNodeHandler } from "better-auth/node";

/**
 * Auth routes — delegates to Better Auth's built-in handler.
 * All /api/auth/* requests are forwarded to Better Auth.
 */
export async function authRoutes(app: FastifyInstance) {
  const handler = toNodeHandler(auth);

  app.all("/api/auth/*", async (request: FastifyRequest, reply: FastifyReply) => {
    // Better Auth expects raw Node.js req/res
    await handler(request.raw, reply.raw);
    // Signal that the response has already been sent
    reply.hijack();
  });
}
