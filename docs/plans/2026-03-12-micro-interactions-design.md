# Micro-Interactions & Loading States Design

**Date:** 2026-03-12
**Status:** Approved
**Approach:** Component-Level Enhancements with shared motion config

## Design Decisions

- **Visual personality:** Smooth & elegant (Stripe-style) — 250-350ms, gentle easing, subtle spring
- **Button loading:** Spinner icon + text swap, auto-disable
- **Page transitions:** Fade only (opacity), 250ms
- **Tech:** framer-motion (~30KB gzipped) + existing tailwindcss-animate

## 1. Motion Config (`lib/motion.ts`)

Shared framer-motion variants:

| Variant | Animation | Duration | Use Case |
|---------|-----------|----------|----------|
| `fadeIn` | opacity 0→1 | 250ms ease-out | Page transitions, list items |
| `slideUp` | translateY 8→0 + fade | 300ms | Cards appearing |
| `scaleIn` | scale 0.95→1 + fade | 200ms | Modals, popovers |
| `stagger` | Parent staggers children | 50ms delay | Card grids, table rows |
| `spring` | Spring physics | stiffness 300, damping 25 | Interactive elements |

## 2. Button Loading States

Upgrade `<Button>` component:
- New `loading?: boolean` prop
- Shows `<Loader2 className="animate-spin" />` + loading text when active
- Smooth width transition (no layout jump)
- Auto-disables when loading
- Replaces manual `isLoading ? t("common.loading") : label` pattern in forms

## 3. Page Transitions

- `<PageTransition>` wrapper using `motion.div` with `fadeIn` variant
- `AnimatePresence` at router level for enter/exit
- 250ms opacity fade

## 4. Toast Improvements

- Slide-in from top-right with spring physics
- Exit: slide-out + fade
- Progress bar showing auto-dismiss countdown

## 5. Card & List Micro-interactions

- **Dashboard cards:** Staggered fade-in, hover lift (translateY -2px + shadow)
- **Table rows:** Fade-in with stagger, hover highlight transition
- **Stat cards:** Number count-up animation on load
- **Empty states:** Gentle bounce-in for icon

## 6. Form Interactions

- **Input focus:** Refined border-color transition timing
- **Field errors:** Shake animation + fade-in for error messages
- **Form success:** Brief success flash before navigation

## 7. Skeleton Enhancements

- Staggered skeleton groups (cards appear left-to-right)
- Smooth crossfade from skeleton → real content

## Files Affected

### New Files
- `apps/web/src/lib/motion.ts` — shared motion variants
- `apps/web/src/components/PageTransition.tsx` — route transition wrapper
- `apps/web/src/components/AnimatedCard.tsx` — card with hover/stagger
- `apps/web/src/components/CountUp.tsx` — number animation component

### Modified Files
- `apps/web/src/components/ui/button.tsx` — loading prop
- `apps/web/src/components/ui/toast.tsx` — animation + progress bar
- `apps/web/src/components/ui/toaster.tsx` — framer-motion integration
- `apps/web/src/components/InvoiceForm.tsx` — use button loading, error animations
- `apps/web/src/components/ProfileForm.tsx` — use button loading, error animations
- `apps/web/src/components/ClientForm.tsx` — use button loading, error animations
- `apps/web/src/pages/Dashboard.tsx` — animated cards, count-up, stagger
- `apps/web/src/pages/Invoices.tsx` — table row stagger, empty state animation
- `apps/web/src/pages/Clients.tsx` — table row stagger, empty state animation
- `apps/web/src/pages/Taxes.tsx` — card animations
- `apps/web/src/pages/TaxSimulator.tsx` — result card animations
- `apps/web/src/pages/Settings.tsx` — page transition
- `apps/web/src/pages/InvoiceDetail.tsx` — card animations
- `apps/web/src/pages/InvoiceEditor.tsx` — page transition
- `apps/web/src/pages/Login.tsx` — button loading
- `apps/web/src/pages/Register.tsx` — button loading
- `apps/web/src/App.tsx` — AnimatePresence wrapper
- `apps/web/package.json` — add framer-motion dependency
- `apps/web/tailwind.config.js` — add shake keyframe
