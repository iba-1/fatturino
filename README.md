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

## Architecture Notes

### Authentication

Auth is handled by [Better Auth](https://www.better-auth.com/), mounted at `/api/auth/*` as a Fastify plugin. Sessions are cookie-based.

Two important quirks:
- **Body parser conflict:** Fastify's default body parser consumes the request body before Better Auth can read it. The auth plugin calls `fastify.removeAllContentTypeParsers()` and registers a no-op wildcard parser so Better Auth gets the raw stream.
- **Auth client baseURL:** The frontend auth client uses `window.location.origin` as `baseURL` (not a hardcoded URL) so cookies are set on the correct origin in both dev and production.

### Database

- **ORM:** Drizzle ORM with PostgreSQL via the `postgres` driver
- **Schema:** `apps/api/src/db/schema.ts`
- **Migrations:** Generated with `pnpm db:generate`, applied with `pnpm db:migrate`. Use `pnpm db:push` in development only (bypasses migration history).
- **Primary keys:** Better Auth tables use `text` PKs (not UUID) — Better Auth generates its own string IDs.

### Monorepo

Turborepo orchestrates builds and tests. Shared code lives in `packages/shared` (tax engine, Zod schemas, TypeScript types) and is consumed by both `apps/api` and `apps/web` without duplication.

## Implementation Status

- [x] Phase 1: Foundation (monorepo, auth, DB, i18n)
- [x] Phase 2: Core Invoicing (clients, invoices, preview, e2e tests)
- [ ] Phase 3: FatturaPA XML + SDI Integration
- [ ] Phase 4: Tax Calculation Engine (UI)
- [ ] Phase 5: F24 Form Generation
- [ ] Phase 6: Polish & Production Readiness

---

## User Guide

### Feature Reference

#### Dashboard

Shows a summary of your recent activity: latest invoices and a quick view of open (draft) invoices. Use this as your starting point each session.

#### Clients

Your customer registry. Each client record stores:
- Business name or full name
- Tax code (Codice Fiscale) or VAT number (Partita IVA)
- Address, email, and contact details

You must create a client before you can issue an invoice to them.

#### Invoices

The core of the app. Invoices have two statuses:

| Status | Meaning |
|---|---|
| **Draft** | Created but not yet issued. Can be edited or deleted. |
| **Issued** | Finalized. Cannot be deleted. |

Each invoice includes:
- One or more line items (description, quantity, unit price)
- Automatic subtotal and total calculation
- **Bollo virtuale** — €2 stamp duty, auto-applied when the invoice total exceeds €77.47 (required under regime forfettario, which is VAT-exempt under N2.2)
- Invoice preview rendered in the browser (PDF-ready layout)

#### Taxes

The tax calculator for regime forfettario. Input your annual revenue and ATECO code to get:
- Taxable income (after applying the coefficiente di redditività)
- Imposta sostitutiva due
- INPS contributions
- Acconto and saldo breakdown with codici tributo

### How-to Guides

#### Create a client

1. Click **Clients** in the sidebar.
2. Click **New Client**.
3. Fill in the client's name, tax code or VAT number, and address.
4. Click **Save**. The client now appears in your registry and can be selected when creating invoices.

#### Create an invoice

1. Click **Invoices** in the sidebar.
2. Click **New Invoice**.
3. Select a client from the dropdown.
4. Set the invoice date and your payment terms.
5. Add one or more line items — enter a description, quantity, and unit price. The line total updates automatically.
6. The subtotal, bollo (if applicable), and total are calculated automatically.
7. Click **Save as Draft** to save without issuing, or **Issue** to finalize.

#### Preview an invoice

1. Open any invoice from the Invoices list.
2. Click **Preview**. A print-ready view opens in the browser.
3. Use your browser's print function (`Cmd+P` / `Ctrl+P`) to export as PDF.

#### Calculate your taxes

1. Click **Taxes** in the sidebar.
2. Enter your total annual revenue (fatturato).
3. Select your ATECO code from the dropdown.
4. Select whether you are in your first 5 years of activity (5% rate) or not (15% rate).
5. Choose your INPS regime (Gestione Separata or Artigiani/Commercianti).
6. The app calculates imposta sostitutiva, INPS contributions, and the acconto/saldo split.
