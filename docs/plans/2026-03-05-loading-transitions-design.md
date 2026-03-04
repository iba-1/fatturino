# Loading Page & Page Transitions — Design

**Date:** 2026-03-05
**Status:** Approved

## Problem

1. The `ProtectedRoute` auth check shows a bare, unbranded spinner — no context, no identity.
2. The `animate-page-in` class sits on the static `<main>` element in `Layout`, so it only fires on first mount, not on every route change.
3. Pages like `Invoices`, `Clients`, and `Settings` have no skeleton loading states — they flicker or show empty space while data loads.

## Goals

- Branded full-page loading screen during auth check
- Smooth per-route fade transitions using the native View Transitions API
- Skeleton screens on all data-heavy pages
- Cover both link-based navigation (`<NavLink>`) and programmatic navigation (`navigate()`)

---

## Architecture

### 1. Router Migration (`App.tsx`)

Migrate from `<BrowserRouter>` + `<Routes>` to `createBrowserRouter` + `<RouterProvider>`. Required for React Router v7's native View Transitions support. The route tree is identical; only the wrapping changes.

```
Before: <BrowserRouter><Routes>...</Routes></BrowserRouter>
After:  const router = createBrowserRouter([...]); <RouterProvider router={router} />
```

### 2. Branded FullPageLoader (`components/FullPageLoader.tsx`)

- Full-screen, dark forest green background (`hsl(var(--sidebar-bg))` = `#064E3B`)
- Centered column: "Fatturino" wordmark in white (`text-2xl font-bold tracking-tight text-white`) + mint ring spinner below (`border-[#6EE7B7]`)
- Used in `ProtectedRoute` during `isPending` state

### 3. View Transitions CSS (`index.css`)

Replace `animate-page-in` with View Transitions API declarations:

```css
/* Old page fades out */
::view-transition-old(root) {
  animation: 120ms ease-in both vt-fade-out;
}

/* New page fades in + slides up */
::view-transition-new(root) {
  animation: 200ms ease-out both vt-fade-in-up;
}

@keyframes vt-fade-out {
  to { opacity: 0; transform: translateY(-4px); }
}

@keyframes vt-fade-in-up {
  from { opacity: 0; transform: translateY(6px); }
}
```

Remove `animate-page-in` from `Layout.tsx`'s `<main>`.

### 4. Custom Navigate Hook (`hooks/use-app-navigate.ts`)

Wraps `useNavigate` to always pass `{ viewTransition: true }`, so all 15 programmatic navigation call sites get transitions without modification:

```ts
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to, options?) => navigate(to, { viewTransition: true, ...options }),
    [navigate]
  );
}
```

Import `useAppNavigate` in all 7 files that use `useNavigate`.

### 5. NavLink Transitions (`Layout.tsx`)

Add `viewTransition` prop to all 5 `<NavLink>` items in the sidebar nav.

### 6. Skeleton Component (`components/ui/skeleton.tsx`)

```tsx
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-skeleton rounded-md bg-secondary", className)} />;
}
```

The `animate-skeleton` keyframe already exists in `index.css`.

### 7. Per-Page Skeleton Layouts

Each page conditionally renders a skeleton when `isLoading` is true:

- **`Invoices`** — skeleton table: header row + 5 placeholder rows
- **`Clients`** — skeleton card grid: 6 placeholder cards
- **`Settings`** — skeleton form: label + input pairs for each field group

---

## Files Changed

| File | Change |
|---|---|
| `App.tsx` | `createBrowserRouter` migration |
| `components/FullPageLoader.tsx` | New branded loading screen |
| `components/ProtectedRoute.tsx` | Use `FullPageLoader` |
| `hooks/use-app-navigate.ts` | New hook wrapping navigate with viewTransition |
| `components/Layout.tsx` | `viewTransition` on `<NavLink>`, remove `animate-page-in` from `<main>` |
| `index.css` | View transition keyframes, remove `animate-page-in` |
| `components/ui/skeleton.tsx` | New `<Skeleton>` primitive |
| `pages/Invoices.tsx` | Import `useAppNavigate`, add `InvoicesSkeleton` |
| `pages/Clients.tsx` | Import `useAppNavigate`, add `ClientsSkeleton` |
| `pages/Settings.tsx` | Add `SettingsSkeleton` |
| `pages/Dashboard.tsx` | Import `useAppNavigate` |
| `pages/InvoiceDetail.tsx` | Import `useAppNavigate` |
| `pages/InvoiceEditor.tsx` | Import `useAppNavigate` |
| `pages/TaxSimulator.tsx` | Import `useAppNavigate` |
| `pages/Login.tsx` | Import `useAppNavigate` |
| `pages/Register.tsx` | Import `useAppNavigate` |

---

## Not In Scope

- Exit animations for modals or dialogs
- Route-level code splitting (tracked separately — bundle >500KB)
- Loading states for `Dashboard` (already has skeleton placeholders)
