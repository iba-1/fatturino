# Bento Dashboard Design — Fatturino

**Date:** 2026-03-03
**Status:** Approved
**Branch:** feature/ui-overhaul

## Goal

Transform the Dashboard from a uniform grid layout into a magazine-style bento grid with visual hierarchy, mixed card styles, and a hero revenue card.

## Design Principles

- **Asymmetric grid** — Cards span different column/row counts for visual interest
- **Hero focal point** — Revenue card is the dominant element (2x2) with embedded mini chart
- **Mixed card styles** — Gradient hero, colored left borders on tax cards, standard white for stats
- **Mobile-first degradation** — Stacks cleanly to single column on mobile

## Grid Structure

### Desktop (lg, 1024px+): 4-column grid

```
┌─────────────────────┬──────────┬──────────┐
│                     │  Sent    │ Pending  │
│   Revenue Hero      │ Invoices │ Invoices │
│   (col-span-2,      ├──────────┼──────────┤
│    row-span-2)      │ Tax Due  │          │
│                     │          │          │
├─────────────────────┴──────────┴──────────┤
│              Revenue Chart                │
│              (col-span-4, 300px)          │
├──────────┬───────────┬────────────────────┤
│ Imposta  │   INPS    │   F24 Schedule     │
│ (border  │  (border  │   (border-l        │
│  -l-4)   │   -l-4)   │    -4)             │
├──────────┴───────────┴────────────────────┤
│           Recent Invoices                 │
│           (col-span-4, table)             │
└───────────────────────────────────────────┘
```

### Tablet (md, 768px): 2-column grid

- Hero card: col-span-2 (full width), no row-span
- Stat cards: 1 col each, wrapping
- Chart: col-span-2
- Tax cards: 1 col each, wrapping
- Recent invoices: col-span-2

### Mobile (<768px): Single column stack

All cards stack vertically in source order.

## Card Styles

### Revenue Hero Card (2x2)

- **Background:** `bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-teal-50`
- **Border:** `border border-emerald-200/60`
- **Content:**
  - Label: "Total Revenue YYYY" — `text-sm font-medium text-emerald-700`
  - Value: `text-4xl font-bold font-mono text-[#064E3B]`
  - Mini bar chart: 150px tall Recharts BarChart showing monthly revenue
  - Chart uses `fill: hsl(var(--primary))` with rounded bars
- **Shadow:** `shadow-md` (stronger than other cards)

### Stat Cards (3x: Sent, Pending, Tax Due)

- Standard white Card component (current design)
- Icon in colored circle (existing style)
- No changes from current implementation

### Tax Cards (3x: Imposta, INPS, F24)

- White Card background
- `border-l-4` colored accent:
  - Imposta Sostitutiva: `border-l-emerald-400`
  - INPS: `border-l-blue-400`
  - F24 Schedule: `border-l-amber-400`
- Content layout unchanged (key/value rows with divider)

### Chart Card (full width)

- Standard white Card, no changes to current design
- Full 4-column span

### Recent Invoices Card (full width)

- Standard white Card, no changes to current design
- Full 4-column span

## Files Affected

- `apps/web/src/pages/Dashboard.tsx` — Complete layout rewrite to bento grid

## Responsive Behavior

| Breakpoint | Columns | Hero span | Notes |
|------------|---------|-----------|-------|
| `<768px` | 1 | full width | All cards stack |
| `md` (768px) | 2 | col-span-2 | Hero full width, no row-span |
| `lg` (1024px) | 4 | col-span-2 row-span-2 | Full bento layout |
