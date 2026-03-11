import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

function parseOrigins(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((o) => o.replace(/\/+$/, ""))
    .filter(Boolean);
}

export function buildTrustedOrigins(env: {
  CORS_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
}): string[] {
  return [
    ...parseOrigins(env.CORS_ORIGINS || "http://localhost:5173"),
    ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL.replace(/\/+$/, "")] : []),
  ];
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
