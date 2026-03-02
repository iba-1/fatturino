# Fatturino

Italian invoicing & tax SaaS for freelancers and small businesses operating under **Regime Forfettario**.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Commands](#commands)
- [API Endpoints](#api-endpoints)
- [Tax Calculation](#tax-calculation-regime-forfettario)
- [Architecture Notes](#architecture-notes)
- [Implementation Status](#implementation-status)
- [User Guide](#user-guide)

## Features

- Electronic invoice (fattura elettronica) creation and management
- Tax calculation engine for Regime Forfettario (imposta sostitutiva + INPS)
- SDI integration via Invoicetronic API (Phase 3)
- Pre-filled F24 form generation (Phase 5)
- Multi-tenant SaaS with email/password and OAuth authentication
- Italian + English interface

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Shadcn/ui |
| State | TanStack Query, Zustand |
| Backend | Fastify, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Better Auth |
| Monorepo | Turborepo, pnpm workspaces |

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for PostgreSQL)

## Quick Start

```bash
# 1. Clone and install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Copy environment file and configure
cp apps/api/.env.example apps/api/.env

# 4. Push database schema
pnpm db:push

# 5. Start development servers
pnpm dev
```

The API runs at `http://localhost:3000` and the web app at `http://localhost:5173`.

## Project Structure

```
fatturino/
├── packages/
│   ├── shared/          # Zod schemas, types, tax calculation engine
│   └── fattura-xml/     # FatturaPA XML builder/parser (Phase 3)
├── apps/
│   ├── api/             # Fastify backend
│   └── web/             # React SPA
├── docker-compose.yml   # PostgreSQL for local dev
└── turbo.json           # Turborepo configuration
```

## Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env` and fill in the required values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Secret for session signing — generate with `openssl rand -base64 32` |
| `CORS_ORIGINS` | Yes | `http://localhost:5173` | Comma-separated allowed frontend origins |
| `PORT` | No | `3000` | API server port |
| `HOST` | No | `0.0.0.0` | API server host |
| `NODE_ENV` | No | `development` | Set to `production` in production |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth client secret |
| `INVOICETRONIC_API_KEY` | No | — | Invoicetronic SDI API key (Phase 3) |
| `INVOICETRONIC_BASE_URL` | No | — | Invoicetronic API base URL (Phase 3) |

> OAuth providers are optional — the app works with email/password auth alone.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all services in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all unit + integration tests (Vitest) |
| `pnpm test:e2e` | Run end-to-end tests (Playwright) |
| `pnpm db:push` | Push schema changes to database (dev only) |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Run pending migrations |

### Running Tests

The test suite has two layers:

**Unit + integration tests** (`pnpm test`) — 119 tests across three packages:
- `packages/shared` — tax calculation engine, Zod schemas
- `apps/api` — route handlers (tested with Fastify's `inject`)
- `apps/web` — TanStack Query hooks, invoice calculation logic

**End-to-end tests** (`pnpm test:e2e`) — Playwright tests covering:
- Auth flows: register, login, invalid credentials
- Client CRUD: create, read, update, delete
- Invoice CRUD: create, view, delete (draft only)

E2E tests require both the API and web dev servers to be running (`pnpm dev`).

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| ALL | `/api/auth/*` | Authentication (Better Auth) |
| GET/POST | `/api/clients` | List / Create clients |
| GET/PUT/DELETE | `/api/clients/:id` | Get / Update / Delete client |
| GET/POST | `/api/invoices` | List / Create invoices |
| GET/DELETE | `/api/invoices/:id` | Get / Delete invoice |
| POST | `/api/taxes/imposta` | Calculate imposta sostitutiva |
| POST | `/api/taxes/inps` | Calculate INPS contributions |
| POST | `/api/taxes/acconto-saldo` | Calculate acconto/saldo breakdown |

## Tax Calculation (Regime Forfettario)

The tax engine in `packages/shared/tax/` implements:

1. **Coefficienti di redditività** — Maps ATECO codes to profitability coefficients (40%–86%)
2. **Imposta sostitutiva** — 5% for first 5 years, 15% thereafter
3. **INPS contributions** — Gestione Separata (26.07%) or Artigiani/Commercianti (fixed + variable, with 35% forfettari discount)
4. **Acconto/saldo** — Payment installment calculation with correct codici tributo

## Implementation Status

- [x] Phase 1: Foundation (monorepo, auth, DB, i18n)
- [x] Phase 2: Core Invoicing (clients, invoices, preview, e2e tests)
- [ ] Phase 3: FatturaPA XML + SDI Integration
- [ ] Phase 4: Tax Calculation Engine (UI)
- [ ] Phase 5: F24 Form Generation
- [ ] Phase 6: Polish & Production Readiness
