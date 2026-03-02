import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../lib/auth.js";
import { toNodeHandler } from "better-auth/node";

/**
 * Auth routes — delegates to Better Auth's built-in handler.
 *
 * Better Auth's toNodeHandler reads the raw request body stream.
 * We must prevent Fastify from consuming it first by removing
 * all content type parsers and adding a no-op one.
 */
export async function authRoutes(app: FastifyInstance) {
  const handler = toNodeHandler(auth);

  // Remove default parsers so Fastify does NOT consume the body stream.
  // This is scoped to this plugin only (Fastify encapsulation).
  app.removeAllContentTypeParsers();
  app.addContentTypeParser("*", function (_request, _payload, done) {
    done(null);
  });

  app.all("/api/auth/*", async (request: FastifyRequest, reply: FastifyReply) => {
    await handler(request.raw, reply.raw);
    reply.hijack();
  });
}
