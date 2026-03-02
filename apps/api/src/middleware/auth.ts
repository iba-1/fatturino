import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

/**
 * Auth middleware — verifies the session from the request headers.
 * Attaches user info to request object.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Valid session required",
    });
  }

  // Attach session to request for downstream handlers
  (request as any).session = session.session;
  (request as any).user = session.user;
}

export function getUserId(request: FastifyRequest): string {
  return (request as any).user.id;
}
