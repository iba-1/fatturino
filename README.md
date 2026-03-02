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

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all services in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Run pending migrations |

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
