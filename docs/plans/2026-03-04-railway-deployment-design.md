# Railway Deployment Design

**Date:** 2026-03-04
**Status:** Implemented (merged PR #15)

## Summary

Deploy the Fatturino monorepo as a single Railway service (monolith) serving both the Fastify API and the Vite-built React SPA. Database is Railway's managed PostgreSQL.

## Architecture

```
Railway Project: fatturino
├── Service: Monolith (Docker)      → fatturino.up.railway.app
│   ├── Fastify API (/api/*, /health)
│   ├── Static SPA (all other routes)
│   └── Playwright/Chromium (PDF generation)
└── Addon: PostgreSQL 16            → internal network URL
```

- **Single origin** — no CORS issues, auth cookies work automatically
- **SPA fallback** — non-API routes return `index.html` for client-side routing
- **Auto-deploy** — Railway watches `main` branch, deploys after CI passes

## Docker Strategy

Multi-stage Dockerfile at repo root:

1. **Stage 1 (builder):** Node 20 + pnpm. Install deps, build all packages in order (shared → fattura-xml → API → Web). Prune dev dependencies.
2. **Stage 2 (runtime):** Node 20-slim + Chromium system deps. Copy built artifacts, install Playwright Chromium browser. Run `node apps/api/dist/server.js`.

Expected image size: ~500-700MB (due to Chromium). Acceptable trade-off for full HTML/CSS PDF rendering.

## Static File Serving

New Fastify plugin (`apps/api/src/plugins/static.ts`):

- Uses `@fastify/static` to serve `apps/web/dist/` at root in production
- Wildcard fallback handler serves `index.html` for SPA routing
- API routes (`/api/*`, `/health`) take priority over static serving
- Only active when `NODE_ENV=production`

## Database Migrations

Switch from `drizzle-kit push` to file-based migrations for production safety:

- **`drizzle-kit generate`** — creates timestamped SQL migration files in `apps/api/drizzle/`
- **`drizzle-kit migrate`** — applies pending migrations (runs before server start on deploy)
- **Dev workflow** — continue using `drizzle-kit push` locally, generate migration files before merging to `main`
- Migration files are committed to git for audit trail and review

## Environment Variables

Railway provides automatically:
- `DATABASE_URL` (from Postgres addon via `${{Postgres.DATABASE_URL}}`)
- `PORT` (set by Railway)

Manual configuration in Railway dashboard:
- `BETTER_AUTH_SECRET` — random 32+ char string
- `RESEND_API_KEY` — email service
- `FROM_EMAIL` — sender address
- `NODE_ENV=production`
- `CORS_ORIGINS` — Railway-generated URL (same-origin, but kept for direct API access)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional, OAuth)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (optional, OAuth)

## CI/CD Pipeline

```
Push to main → GitHub Actions CI (lint, typecheck, test, build)
             → Railway auto-deploy (watches main branch)
             → Deploy command: run migrations
             → Start command: node apps/api/dist/server.js
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `Dockerfile` | Create | Multi-stage build for monolith |
| `.dockerignore` | Create | Exclude unnecessary files from build context |
| `apps/api/src/plugins/static.ts` | Create | Serve frontend static files in production |
| `apps/api/src/server.ts` | Modify | Register static plugin, adjust for production |
| `apps/api/package.json` | Modify | Add `@fastify/static`, migration scripts |
| `apps/api/drizzle.config.ts` | Modify | Configure migration output directory |
| `railway.toml` | Create | Railway build/deploy configuration |

## Decisions

- **Monolith over microservices** — simpler ops for single developer, split later if needed
- **Playwright in main image** — accept 500-700MB image for best PDF quality
- **File-based migrations** — production safety over dev convenience
- **Railway subdomain initially** — custom domain can be added later
- **Auto-deploy from main** — combined with existing GitHub Actions CI
