import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

/**
 * Resolves the application's public URL.
 *
 * Priority:
 *   1. Explicit BETTER_AUTH_URL env var
 *   2. Railway's auto-provided RAILWAY_PUBLIC_DOMAIN
 *   3. Local dev fallback
 */
export function resolveBaseURL(env: {
  BETTER_AUTH_URL?: string;
  RAILWAY_PUBLIC_DOMAIN?: string;
  PORT?: string;
}): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.RAILWAY_PUBLIC_DOMAIN) return `https://${env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${env.PORT || "3000"}`;
}

export function buildTrustedOrigins(env: {
  CORS_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
  RAILWAY_PUBLIC_DOMAIN?: string;
  PORT?: string;
}): string[] {
  const baseOrigin = new URL(resolveBaseURL(env)).origin;
  const origins = new Set<string>([baseOrigin]);

  for (const o of (env.CORS_ORIGINS || "http://localhost:5173").split(",")) {
    origins.add(o.trim());
  }

  return [...origins];
}

export const auth = betterAuth({
  baseURL: resolveBaseURL(process.env),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
  },
  trustedOrigins: buildTrustedOrigins(process.env),
});
