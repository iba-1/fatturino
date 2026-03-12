# UI Revamp Design: Vercel/Stripe-Inspired

**Date**: 2026-03-12
**Starting point**: PR #28 branch (`worktree-feature-micro-interactions-and-loading`)
**Approach**: Token-First Layered Revamp

## Design Decisions

| Decision | Choice |
|---|---|
| Palette | Full swap to cool neutrals (zinc scale) |
| Accent | Teal-500 (#14B8A6) → Emerald-500 (#10B981) gradient |
| Dark mode | Both light + dark, class-based with system detection |
| Sidebar | Stripe-style: light/white, right border, icons + labels |
| Gradients | Moderate: buttons, card hover borders, page headers, charts, empty states, badges |
| Typography | Inter (body) + JetBrains Mono (numerics) — unchanged |
| Animation | framer-motion from PR #28 — extend, don't replace |

## Layer Strategy

```
Layer 1: CSS tokens (index.css) — light + dark variable sets
Layer 2: Tailwind config — darkMode: 'class', gradient utilities
Layer 3: ThemeProvider — dark mode toggle, localStorage, system pref
Layer 4: UI primitives — button, card, input, badge, table, select, toast
Layer 5: Sidebar — full Stripe-style redesign with user section + theme toggle
Layer 6: Pages — dashboard, invoices, clients, taxes, settings, auth
Layer 7: Hardcoded color cleanup — replace all inline Tailwind color classes with tokens
```

## Color Token System

### Light Mode

| Token | Value | Hex |
|---|---|---|
| background | zinc-50 | #FAFAFA |
| foreground | zinc-900 | #18181B |
| card | white | #FFFFFF |
| card-foreground | zinc-900 | #18181B |
| muted | zinc-100 | #F4F4F5 |
| muted-foreground | zinc-500 | #71717A |
| border | zinc-200 | #E4E4E7 |
| input | zinc-200 | #E4E4E7 |
| ring | teal-500 | #14B8A6 |
| primary | teal-500 | #14B8A6 |
| primary-foreground | white | #FFFFFF |
| secondary | zinc-100 | #F4F4F5 |
| secondary-foreground | zinc-900 | #18181B |
| accent | teal-50 | #F0FDFA |
| accent-foreground | teal-700 | #0F766E |
| destructive | red-500 | #EF4444 |
| destructive-foreground | white | #FFFFFF |
| success | emerald-500 | #10B981 |
| warning | amber-500 | #F59E0B |
| sidebar-bg | white | #FFFFFF |
| sidebar-foreground | zinc-900 | #18181B |
| sidebar-border | zinc-200 | #E4E4E7 |
| sidebar-active | teal-50 | #F0FDFA |
| sidebar-active-text | teal-700 | #0F766E |
| sidebar-muted | zinc-500 | #71717A |
| gradient-from | teal-500 | #14B8A6 |
| gradient-to | emerald-500 | #10B981 |

### Dark Mode

| Token | Value | Hex |
|---|---|---|
| background | zinc-950 | #09090B |
| foreground | zinc-50 | #FAFAFA |
| card | zinc-900 | #18181B |
| card-foreground | zinc-50 | #FAFAFA |
| muted | zinc-800 | #27272A |
| muted-foreground | zinc-400 | #A1A1AA |
| border | zinc-800 | #27272A |
| input | zinc-800 | #27272A |
| ring | teal-500 | #14B8A6 |
| primary | teal-400 | #2DD4BF |
| primary-foreground | teal-950 | #042F2E |
| secondary | zinc-800 | #27272A |
| secondary-foreground | zinc-50 | #FAFAFA |
| accent | teal-950 | #042F2E |
| accent-foreground | teal-300 | #5EEAD4 |
| destructive | red-600 | #DC2626 |
| destructive-foreground | white | #FFFFFF |
| success | emerald-400 | #34D399 |
| warning | amber-400 | #FBBF24 |
| sidebar-bg | zinc-950 | #09090B |
| sidebar-foreground | zinc-50 | #FAFAFA |
| sidebar-border | zinc-800 | #27272A |
| sidebar-active | teal-950 | #042F2E |
| sidebar-active-text | teal-300 | #5EEAD4 |
| sidebar-muted | zinc-500 | #71717A |
| gradient-from | teal-400 | #2DD4BF |
| gradient-to | emerald-400 | #34D399 |

### Chart Colors

| Token | Light | Dark |
|---|---|---|
| chart-1 | teal-500 | teal-400 |
| chart-2 | emerald-500 | emerald-400 |
| chart-3 | cyan-500 | cyan-400 |
| chart-4 | sky-500 | sky-400 |
| chart-5 | violet-500 | violet-400 |

## Component Designs

### Sidebar (Stripe-style)

- Background: white (light) / zinc-950 (dark)
- 1px right border (`border-r border-border`)
- **Top**: user avatar (initials circle) + name + dropdown (logout, theme)
- Brand name "fatturino" below user, smaller muted text
- Separator
- Nav items: icon + label, `rounded-lg`, `hover:bg-muted`, `transition-colors`
- Active item: `bg-accent text-accent-foreground font-medium` + 2px left teal bar
- Separated bottom section: Settings link + theme toggle (sun/moon/monitor)
- Mobile: same slide-in behavior, backdrop blur stays

### Buttons

- **default (primary)**: `bg-gradient-to-r from-teal-500 to-emerald-500` white text
  - Hover: darker gradient + glow `shadow-[0_0_20px_rgba(20,184,166,0.3)]`
  - Active: `scale-[0.98]`
  - Dark: from-teal-400 to-emerald-400, dark text
- **secondary**: `bg-zinc-100` / `bg-zinc-800`
- **outline**: `border border-border` transparent bg, hover `bg-muted`
- **ghost**: no border/bg, `text-muted-foreground`, hover `bg-muted`
- **destructive**: `bg-red-500` / `bg-red-600`
- **link**: underline, teal color
- `loading` prop from PR #28 stays

### Cards

- Light: `bg-white border border-zinc-200 rounded-xl shadow-sm`
- Dark: `bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm`
- Hover: gradient border shimmer (pseudo-element or outline technique)
- Dashboard hero card: subtle teal mesh gradient bg at 5% opacity

### Inputs & Selects

- `h-10 rounded-lg border border-input bg-background`
- Focus: `ring-2 ring-ring/20 border-ring`
- All native `<select>` replaced with Radix `Select`

### Badges (gradient tints)

- draft: `bg-zinc-100 text-zinc-600`
- sent: `bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700`
- paid: `bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700`
- overdue: `bg-gradient-to-r from-red-50 to-orange-50 text-red-700`
- Dark mode: same gradient directions but darker base + lighter text

### Tables

- Header: `text-xs uppercase tracking-wider text-muted-foreground bg-muted/50`
- Rows: `border-b border-border hover:bg-muted/50 transition-colors`
- Amounts: `font-mono tabular-nums`

### Empty States

- Centered: muted icon (48px) + h3 + description + gradient CTA button
- Background: radial gradient orb `teal-500/10 → transparent`

### Toasts

- Keep improved timing from PR #28
- Update colors to use new token system
- Progress bar stays

## Dark Mode Implementation

### ThemeProvider

```tsx
// Custom ThemeProvider component
// - reads system preference via window.matchMedia('(prefers-color-scheme: dark)')
// - stores user choice in localStorage ('theme' key)
// - applies .dark class to document.documentElement
// - provides useTheme() hook returning { theme, setTheme, systemTheme }
// - three modes: 'light' | 'dark' | 'system'
```

### Tailwind Config

```js
darkMode: 'class'
```

### Toggle Location

Bottom of sidebar: icon button cycling light → dark → system (Sun → Moon → Monitor icons).

## Page-Level Changes

### Dashboard

- Remove colored left borders on tax cards → icon + clean card
- Hero revenue card: subtle teal mesh gradient bg at 5%
- Chart fills: linearGradient teal→emerald with opacity fade
- Year selector: Radix Select (replace native)
- Stagger/CountUp animations from PR #28 stay

### Invoices

- Gradient primary "New Invoice" button
- Gradient-tint status badges
- Row hover: `bg-muted/50`
- Skeleton crossfade from PR #28 stays

### Clients

- Same table cleanup as Invoices
- Dialog modals get updated card/input styling automatically via tokens

### Taxes

- Remove colored left borders → clean card with icon
- Payment rows: cleaner layout with token-based colors

### Tax Simulator

- Same input/card cleanup via tokens
- Result cards: clean layout matching tax cards

### Settings (ProfileForm)

- Form section headers with Separator
- Input styling via tokens

### Auth (Login/Register)

- Centered card on subtle gradient mesh background
- Gradient primary submit button
- Clean, minimal layout

## Hardcoded Color Cleanup

Replace all instances of direct Tailwind colors with semantic tokens:

- `text-emerald-700` → `text-accent-foreground` or `text-success`
- `border-l-emerald-400` → remove (no more colored borders)
- `bg-amber-50` → `bg-warning/10` or semantic token
- `text-blue-700` → semantic token
- `border-l-blue-400` → remove

## What Does NOT Change

- Routing structure (all routes stay)
- Data flow (TanStack Query hooks, mutations, error handling)
- Form state management (plain useState)
- i18n (no translation key changes)
- API layer (no backend changes)
- framer-motion animations from PR #28 (extended, not replaced)

## New Files

- `apps/web/src/components/ThemeProvider.tsx` — dark mode provider + useTheme hook
- `apps/web/src/components/ThemeToggle.tsx` — sun/moon/monitor cycling button

## New Dependencies

- None — all styling is CSS/Tailwind. Dark mode is custom (no next-themes needed in Vite).
