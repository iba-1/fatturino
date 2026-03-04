import { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function staticPlugin(app: FastifyInstance) {
  if (process.env.NODE_ENV !== "production") return;

  const webDistPath = path.resolve(__dirname, "../../../web/dist");

  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: "/",
    wildcard: false,
    decorateReply: true,
  });

  // SPA fallback — serve index.html for all non-API, non-static routes
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.sendFile("index.html");
  });
}
