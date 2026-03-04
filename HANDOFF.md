# Handoff: Fatturino

## Current State

All implementation phases are **merged to main** and CI is green. The app is ready for its first production deployment.

### What's Built

| Phase | Status | PR |
|-------|--------|-----|
| Phase 1: Foundation (monorepo, auth, DB, i18n) | Merged | #1 |
| Phase 2: Core Invoicing (clients, invoices, e2e) | Merged | #2 |
| Phase 2.5: Error Handling & Notifications | Merged | #5 |
| Phase 3: FatturaPA XML + PDF export | Merged | #3 |
| Phase 4: Dashboard & Tax Overview | Merged | #4 |
| Phase 5: Invoice Editing | Merged | #7 |
| UI Overhaul | Merged | #6 |
| Deployment Setup (Docker + Railway) | Merged | #15 |

### Architecture

- **Monorepo:** Turborepo + pnpm. `packages/shared` (tax engine, schemas), `packages/fattura-xml` (XML builder), `apps/api` (Fastify), `apps/web` (React SPA)
- **Deployment:** Single Docker container (monolith) — Fastify serves both API and static frontend. Railway with managed PostgreSQL.
- **CI:** GitHub Actions — lint, typecheck, unit tests, e2e tests, Docker build validation

## Next Steps (Priority Order)

### 1. First Railway Deployment

The Docker + Railway config is merged. Manual steps remaining:

1. Create a Railway project at https://railway.app
2. Add a PostgreSQL 16 addon
3. Connect the GitHub repo → auto-deploy from `main`
4. Set environment variables in Railway dashboard:
   - `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
   - `RESEND_API_KEY` — from https://resend.com
   - `FROM_EMAIL` — e.g. `noreply@fatturino.app`
   - `NODE_ENV=production`
   - `CORS_ORIGINS` — the Railway-generated URL
5. Verify: health check passes, frontend loads, auth works

### 2. Remaining Feature Work

- **Phase 3.5:** SDI integration (Invoicetronic API) — send invoices to the Italian tax authority
- **Phase 5:** F24 form generation — pre-filled payment forms
- **Phase 6:** Polish & production readiness — code splitting (bundle >500KB), custom domain, monitoring

### 3. Known Issues

- JS bundle >500KB — needs code splitting / lazy loading
- No `components.json` for shadcn CLI — components added manually
- `refetchOnWindowFocus: false` set globally to prevent form data loss during editing
- Better Auth warns about missing `BETTER_AUTH_URL` in production — set it to the Railway URL

## Key Patterns to Follow

- **Forms:** Plain `useState` (no react-hook-form). Server errors via `serverErrors` prop + `parseApiFieldErrors`
- **Mutations:** All hooks have `onError`/`onSuccess` with toast + structured logger
- **Tax engine:** Pure functions in `@fatturino/shared` — `calcolaImposta`, `calcolaInps`, `calcolaAccontoSaldo`
- **DB migrations:** `drizzle-kit generate` locally → commit SQL files → `drizzle-kit migrate` runs on deploy (before server start)
- **Charts:** shadcn/ui `chart.tsx` wrapping Recharts (manual, no components.json)

## Design Documents

All design docs and implementation plans are in `docs/plans/`:
- `2026-03-04-railway-deployment-design.md` — Railway deployment architecture
- `2026-03-04-railway-deployment.md` — Implementation plan (completed)
- Earlier phases have their own design + plan docs in the same directory
