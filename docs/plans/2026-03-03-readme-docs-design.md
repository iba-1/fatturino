# Design: README + Documentation Update

**Date:** 2026-03-03
**Audience:** Developer (solo) + End users
**Location:** Single `README.md` at repo root

---

## Goal

Update the existing README and add a User Guide section so the file serves both:
1. The developer — quick-start, env vars, test commands, architecture notes
2. End users — feature reference, how-to guides, forfettario concepts explained

---

## Structure (Option A: Developer-first)

```
# Fatturino
[tagline]

## Table of Contents
[anchor links to all sections]

## Features
[existing, keep]

## Tech Stack
[update React 18 → 19]

## Prerequisites
[existing, keep]

## Quick Start
[existing, keep]

## Project Structure
[existing, keep]

## Environment Variables
[NEW — reference table of all required/optional env vars]

## Commands
[existing + add Running Tests subsection]

## API Endpoints
[existing, keep]

## Tax Calculation (Regime Forfettario)
[existing, keep]

## Architecture Notes
[NEW — auth setup, Better Auth quirks, cookie sessions]

## Implementation Status
[update: Phase 2 ✅, Phase 3 in progress]

---

## User Guide

### Feature Reference
- Dashboard
- Clients
- Invoices (draft vs issued, status lifecycle)
- Taxes

### How-to Guides
1. Create a client
2. Create an invoice
3. Preview an invoice
4. Calculate your taxes

### Forfettario Explained
[Plain-language: coefficiente di redditività, imposta sostitutiva 5%/15%, INPS, bollo virtuale]
```

---

## Key Content Decisions

### Environment Variables (new section)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret for session signing (min 32 chars) |
| `CORS_ORIGIN` | Yes | Allowed frontend origin (e.g. `http://localhost:5173`) |
| `PORT` | No | API port, default `3000` |

### Running Tests (addition to Commands)
- `pnpm test` — unit + integration (Vitest), 119 tests across shared/api/web
- `pnpm test:e2e` — Playwright end-to-end (auth, client CRUD, invoice CRUD)

### Architecture Notes (new)
- Better Auth is mounted at `/api/auth/*` via a Fastify plugin
- `removeAllContentTypeParsers()` is called before auth plugin to prevent Fastify consuming the request body first
- Sessions are cookie-based; auth client uses `window.location.origin` as baseURL (not hardcoded)
- DB uses text PKs (not UUID) for Better Auth compatibility

### Forfettario Explained
Cover in plain language:
- **Coefficiente di redditività** — percentage of revenue treated as taxable income (varies by ATECO code, 40%–86%)
- **Imposta sostitutiva** — flat tax: 5% first 5 years, 15% thereafter
- **INPS contributions** — Gestione Separata (26.07%) or Artigiani/Commercianti (fixed + variable with 35% forfettari discount)
- **Bollo virtuale** — €2 stamp duty auto-applied to invoices > €77.47 (N2.2 VAT exemption)
- **Acconto/saldo** — advance and balance payment schedule with codici tributo

---

## Out of Scope
- Separate docs site (VitePress, Docusaurus) — not needed at this stage
- Per-app READMEs (`apps/api/README.md`, `apps/web/README.md`)
- Screenshots or GIFs (no design assets available yet)
