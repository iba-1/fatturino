import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerRateLimit } from "./middleware/rate-limit.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { clientRoutes } from "./routes/clients.js";
import { invoiceRoutes } from "./routes/invoices.js";
import { taxRoutes } from "./routes/taxes.js";
import { sdiRoutes } from "./routes/sdi.js";
import { profileRoutes } from "./routes/profile.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { staticPlugin } from "./plugins/static.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",");

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    },
  });

  // CORS — specific origins only
  await app.register(cors, {
    origin: CORS_ORIGINS,
    credentials: true,
  });

  // Rate limiting
  await registerRateLimit(app);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(clientRoutes);
  await app.register(invoiceRoutes);
  await app.register(taxRoutes);
  await app.register(sdiRoutes);
  await app.register(profileRoutes);
  await app.register(dashboardRoutes);

  // Static frontend (production only)
  await app.register(staticPlugin);

  return app;
}

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Fatturino API running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
