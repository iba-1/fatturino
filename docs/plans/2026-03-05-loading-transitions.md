# Loading Page & Page Transitions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a branded auth splash screen, View Transitions API page animations, and a reusable Skeleton component with meaningful per-page loading states.

**Architecture:** Migrate `App.tsx` from `<BrowserRouter>` to `createBrowserRouter` (required for React Router v7 native View Transitions support), create a `useAppNavigate` hook that auto-passes `{ viewTransition: true }` to every programmatic navigation, add CSS `::view-transition-*` keyframes replacing the broken `animate-page-in`, and build a branded `FullPageLoader` replacing the bare spinner in `ProtectedRoute`.

**Tech Stack:** React 19, React Router v7 (`react-router-dom ^7.2.0`), Tailwind CSS, Vitest + @testing-library/react

---

### Task 1: CSS — View Transitions Keyframes

Remove the non-functional `animate-page-in` approach and replace with proper View Transitions API CSS. The current `animate-page-in` only fires when `<main>` mounts (layout mount), not on every route change — this is the root bug.

**Files:**
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/components/Layout.tsx` (line 117)

**Step 1: Replace the page-fade-in block in index.css**

Find the block starting at line 59 in `apps/web/src/index.css`:

```css
/* Page fade-in animation */
@keyframes page-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-page-in {
  animation: page-fade-in 150ms ease-out;
}
```

Replace it with:

```css
/* View Transitions API — page navigation animations */
::view-transition-old(root) {
  animation: 120ms ease-in both vt-fade-out;
}

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

**Step 2: Update the reduced-motion block**

Find the `@media (prefers-reduced-motion: reduce)` block and replace the class reference:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  [class*="transition"],
  [class*="animate-"] {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 3: Remove animate-page-in from Layout.tsx**

In `apps/web/src/components/Layout.tsx` at line 117, change:
```tsx
<main className="animate-page-in flex-1 p-6 lg:p-8">
```
to:
```tsx
<main className="flex-1 p-6 lg:p-8">
```

**Step 4: Verify the build**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web build
```
Expected: Build succeeds with no TypeScript errors.

**Step 5: Commit**

```bash
git add apps/web/src/index.css apps/web/src/components/Layout.tsx
git commit -m "feat: replace animate-page-in with View Transitions API CSS keyframes"
```

---

### Task 2: FullPageLoader Component

Create a branded loading screen for the auth check. Currently `ProtectedRoute` shows an unstyled spinner with no brand context.

**Files:**
- Create: `apps/web/src/components/FullPageLoader.tsx`
- Create: `apps/web/src/__tests__/full-page-loader.test.tsx`
- Modify: `apps/web/src/components/ProtectedRoute.tsx`

**Step 1: Write the failing test**

Create `apps/web/src/__tests__/full-page-loader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { FullPageLoader } from "@/components/FullPageLoader";

describe("FullPageLoader", () => {
  it("renders the Fatturino wordmark", () => {
    render(<FullPageLoader />);
    expect(screen.getByText("Fatturino")).toBeInTheDocument();
  });

  it("renders a status spinner", () => {
    const { container } = render(<FullPageLoader />);
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run src/__tests__/full-page-loader.test.tsx
```
Expected: FAIL — "Cannot find module '@/components/FullPageLoader'"

**Step 3: Create the component**

```tsx
// apps/web/src/components/FullPageLoader.tsx
export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--sidebar-bg))]">
      <div className="flex flex-col items-center gap-4">
        <span className="text-2xl font-bold tracking-tight text-white">
          Fatturino
        </span>
        <div
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-4 border-[#6EE7B7] border-t-transparent"
        />
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run src/__tests__/full-page-loader.test.tsx
```
Expected: PASS

**Step 5: Update ProtectedRoute**

Replace the entire contents of `apps/web/src/components/ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/lib/auth";
import { FullPageLoader } from "@/components/FullPageLoader";

export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <FullPageLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**Step 6: Verify existing ProtectedRoute tests still pass**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run src/__tests__/protected-route.test.tsx
```
Expected: All tests pass. (They use `MemoryRouter` wrapping `ProtectedRoute`, so the component's internals don't matter — just that it renders the right output based on session state.)

**Step 7: Commit**

```bash
git add apps/web/src/components/FullPageLoader.tsx \
        apps/web/src/__tests__/full-page-loader.test.tsx \
        apps/web/src/components/ProtectedRoute.tsx
git commit -m "feat: branded FullPageLoader replacing bare auth spinner"
```

---

### Task 3: Router Migration to createBrowserRouter

React Router v7's `viewTransition` prop on `<NavLink>` and the `{ viewTransition: true }` option on `navigate()` only work when the app uses a **data router** (`createBrowserRouter`). The legacy `<BrowserRouter>` silently ignores these flags.

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Rewrite App.tsx**

Replace the entire file:

```tsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Invoices } from "@/pages/Invoices";
import { InvoiceEditor } from "@/pages/InvoiceEditor";
import { InvoiceDetail } from "@/pages/InvoiceDetail";
import { Clients } from "@/pages/Clients";
import { Taxes } from "@/pages/Taxes";
import { TaxSimulator } from "@/pages/TaxSimulator";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "invoices", element: <Invoices /> },
          { path: "invoices/new", element: <InvoiceEditor /> },
          { path: "invoices/:id", element: <InvoiceDetail /> },
          { path: "invoices/:id/edit", element: <InvoiceEditor /> },
          { path: "clients", element: <Clients /> },
          { path: "taxes", element: <Taxes /> },
          { path: "taxes/simulator", element: <TaxSimulator /> },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
```

**Step 2: Run the full test suite**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run
```
Expected: All tests pass.

> **If tests fail:** Tests that render `<ProtectedRoute>` or page components wrap them in `<MemoryRouter>`, which is independent of `createBrowserRouter`. Those tests should be unaffected. If you see test failures, check whether any test file imports `BrowserRouter` from `react-router-dom` — those would need updating.

**Step 3: Sanity check in dev**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web dev
```
Open http://localhost:5173. Navigate around — all routes should work. Close the dev server (`Ctrl+C`).

**Step 4: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "refactor: migrate to createBrowserRouter for View Transitions API support"
```

---

### Task 4: useAppNavigate Hook + Wire viewTransition Everywhere

15 programmatic `navigate()` calls exist across 7 files. Instead of editing each call site, create a wrapper hook that bakes in `{ viewTransition: true }` automatically.

**Files:**
- Create: `apps/web/src/hooks/use-app-navigate.ts`
- Create: `apps/web/src/__tests__/use-app-navigate.test.tsx`
- Modify: `apps/web/src/components/Layout.tsx` (NavLink + useNavigate)
- Modify: `apps/web/src/pages/Invoices.tsx`
- Modify: `apps/web/src/pages/Dashboard.tsx`
- Modify: `apps/web/src/pages/InvoiceDetail.tsx`
- Modify: `apps/web/src/pages/InvoiceEditor.tsx`
- Modify: `apps/web/src/pages/TaxSimulator.tsx`
- Modify: `apps/web/src/pages/Login.tsx`
- Modify: `apps/web/src/pages/Register.tsx`

> **Note:** `Clients.tsx` does NOT import `useNavigate` — skip it.

**Step 1: Write the failing test**

Create `apps/web/src/__tests__/use-app-navigate.test.tsx`:

```tsx
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAppNavigate } from "@/hooks/use-app-navigate";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("useAppNavigate", () => {
  beforeEach(() => mockNavigate.mockClear());

  it("adds viewTransition: true automatically", () => {
    const { result } = renderHook(() => useAppNavigate(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    result.current("/invoices");
    expect(mockNavigate).toHaveBeenCalledWith("/invoices", { viewTransition: true });
  });

  it("merges caller options, keeping viewTransition", () => {
    const { result } = renderHook(() => useAppNavigate(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    result.current("/invoices", { replace: true });
    expect(mockNavigate).toHaveBeenCalledWith("/invoices", {
      replace: true,
      viewTransition: true,
    });
  });

  it("passes numeric delta directly without options", () => {
    const { result } = renderHook(() => useAppNavigate(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });
    result.current(-1);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run src/__tests__/use-app-navigate.test.tsx
```
Expected: FAIL — "Cannot find module '@/hooks/use-app-navigate'"

**Step 3: Create the hook**

```ts
// apps/web/src/hooks/use-app-navigate.ts
import { useCallback } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";

export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        navigate(to);
      } else {
        navigate(to, { viewTransition: true, ...options });
      }
    },
    [navigate]
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run src/__tests__/use-app-navigate.test.tsx
```
Expected: PASS (3 tests)

**Step 5: Add viewTransition to NavLink in Layout.tsx**

In `apps/web/src/components/Layout.tsx`:

1. Change the import line — replace `useNavigate` with nothing (remove it since we'll use useAppNavigate):
   ```tsx
   // Before (line 1):
   import { Outlet, NavLink, useNavigate } from "react-router-dom";
   // After:
   import { Outlet, NavLink } from "react-router-dom";
   ```

2. Add the useAppNavigate import after the existing imports:
   ```tsx
   import { useAppNavigate } from "@/hooks/use-app-navigate";
   ```

3. In the `Layout` function, change:
   ```tsx
   const navigate = useNavigate();
   ```
   to:
   ```tsx
   const navigate = useAppNavigate();
   ```

4. Add `viewTransition` prop to every `<NavLink>` in the `navItems.map(...)`:
   ```tsx
   <NavLink
     key={path}
     to={path}
     end={path === "/"}
     viewTransition
     onClick={() => setSidebarOpen(false)}
     className={({ isActive }) => ...}
   >
   ```

**Step 6: Update each page — swap useNavigate for useAppNavigate**

For each of the 7 files below, make two edits:
- Remove `useNavigate` from the `react-router-dom` import (keep other imports from that line)
- Add `import { useAppNavigate } from "@/hooks/use-app-navigate";`
- Change `const navigate = useNavigate();` → `const navigate = useAppNavigate();`

**`apps/web/src/pages/Invoices.tsx`** (line 2, line 73):
```tsx
// line 2 — before:
import { useNavigate } from "react-router-dom";
// line 2 — after: (remove this import entirely, useNavigate is the only import)

// Add new import:
import { useAppNavigate } from "@/hooks/use-app-navigate";

// line 73 — before:
const navigate = useNavigate();
// line 73 — after:
const navigate = useAppNavigate();
```

**`apps/web/src/pages/Dashboard.tsx`** (line 3, line 17):
```tsx
// line 3 — before:
import { useNavigate } from "react-router-dom";
// Remove this line entirely

// Add:
import { useAppNavigate } from "@/hooks/use-app-navigate";

// line 17 — before:
const navigate = useNavigate();
// after:
const navigate = useAppNavigate();
```

**`apps/web/src/pages/InvoiceDetail.tsx`** (line 2, line 16):
```tsx
// line 2 — before:
import { useNavigate, useParams } from "react-router-dom";
// after:
import { useParams } from "react-router-dom";

// Add:
import { useAppNavigate } from "@/hooks/use-app-navigate";

// line 16 — before:
const navigate = useNavigate();
// after:
const navigate = useAppNavigate();
```

**`apps/web/src/pages/InvoiceEditor.tsx`** — read the file first to find the exact line numbers, then apply the same pattern.

**`apps/web/src/pages/TaxSimulator.tsx`** — same pattern.

**`apps/web/src/pages/Login.tsx`** (line 2, line 12):
```tsx
// line 2 — before:
import { Link, useNavigate, Navigate } from "react-router-dom";
// after:
import { Link, Navigate } from "react-router-dom";

// Add:
import { useAppNavigate } from "@/hooks/use-app-navigate";

// line 12 — before:
const navigate = useNavigate();
// after:
const navigate = useAppNavigate();
```

**`apps/web/src/pages/Register.tsx`** — same pattern as Login.

**Step 7: Run full test suite**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run
```
Expected: All tests pass.

**Step 8: Type check**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web exec tsc --noEmit
```
Expected: No errors.

**Step 9: Commit**

```bash
git add apps/web/src/hooks/use-app-navigate.ts \
        apps/web/src/__tests__/use-app-navigate.test.tsx \
        apps/web/src/components/Layout.tsx \
        apps/web/src/pages/Invoices.tsx \
        apps/web/src/pages/Dashboard.tsx \
        apps/web/src/pages/InvoiceDetail.tsx \
        apps/web/src/pages/InvoiceEditor.tsx \
        apps/web/src/pages/TaxSimulator.tsx \
        apps/web/src/pages/Login.tsx \
        apps/web/src/pages/Register.tsx
git commit -m "feat: useAppNavigate hook wires viewTransition to all programmatic navigations"
```

---

### Task 5: Skeleton Primitive Component

Create a reusable `<Skeleton>` component that wraps the existing `animate-skeleton` animation.

**Files:**
- Create: `apps/web/src/components/ui/skeleton.tsx`
- Create: `apps/web/src/__tests__/skeleton.test.tsx`

**Step 1: Write the failing test**

Create `apps/web/src/__tests__/skeleton.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("has animate-skeleton class", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-skeleton");
  });

  it("accepts additional className", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    expect(container.firstChild).toHaveClass("h-10", "w-full", "animate-skeleton");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run src/__tests__/skeleton.test.tsx
```
Expected: FAIL

**Step 3: Create the component**

```tsx
// apps/web/src/components/ui/skeleton.tsx
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-skeleton rounded-md bg-secondary", className)} />
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run src/__tests__/skeleton.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/ui/skeleton.tsx \
        apps/web/src/__tests__/skeleton.test.tsx
git commit -m "feat: add reusable Skeleton UI primitive"
```

---

### Task 6: Per-Page Skeleton States

Upgrade loading states to use `<Skeleton>` with shapes that match the actual content.

**Files:**
- Modify: `apps/web/src/pages/Settings.tsx`
- Modify: `apps/web/src/pages/Invoices.tsx`
- Modify: `apps/web/src/pages/Clients.tsx`

#### Settings.tsx

`Settings` currently shows `<p>{t("common.loading")}</p>` — plain text. Replace with a form-shaped skeleton.

**Step 1: Update Settings.tsx**

Add the import at the top of the file:
```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

Add a `SettingsSkeleton` component at the bottom of the file (before the final closing `}`):

```tsx
function SettingsSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-28" />
    </div>
  );
}
```

Replace the `isLoading` branch:
```tsx
// Before:
{isLoading ? (
  <p className="text-muted-foreground">{t("common.loading")}</p>
) : (

// After:
{isLoading ? (
  <SettingsSkeleton />
) : (
```

#### Invoices.tsx

The current skeleton is 5 generic full-width rectangles. Replace with `<Skeleton>` components shaped like the table columns.

**Step 2: Update Invoices.tsx**

Add at the top:
```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

Add `InvoicesSkeleton` at the bottom of the file:

```tsx
function InvoicesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-1 py-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}
```

Replace the `isLoading` branch inside the `<div className="mt-6">`:
```tsx
// Before:
{isLoading ? (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-14 rounded-lg bg-secondary animate-skeleton" />
    ))}
  </div>

// After:
{isLoading ? (
  <InvoicesSkeleton />
```

#### Clients.tsx

Same upgrade as Invoices.

**Step 3: Update Clients.tsx**

Add at the top:
```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

Add `ClientsSkeleton` at the bottom:

```tsx
function ClientsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-1 py-1">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
```

Replace the `isLoading` branch:
```tsx
// Before:
{isLoading ? (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-14 rounded-lg bg-secondary animate-skeleton" />
    ))}
  </div>

// After:
{isLoading ? (
  <ClientsSkeleton />
```

**Step 4: Run full test suite**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run
```
Expected: All pass.

**Step 5: Type check**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web exec tsc --noEmit
```
Expected: No errors.

**Step 6: Commit**

```bash
git add apps/web/src/pages/Settings.tsx \
        apps/web/src/pages/Invoices.tsx \
        apps/web/src/pages/Clients.tsx
git commit -m "feat: per-page skeleton loading states with Skeleton component"
```

---

## Summary

| Task | What changes | Why |
|---|---|---|
| 1 | `index.css`, `Layout.tsx` | Replace broken animate-page-in with real View Transitions CSS |
| 2 | `FullPageLoader.tsx`, `ProtectedRoute.tsx` | Branded auth splash |
| 3 | `App.tsx` | Router migration required for viewTransition support |
| 4 | `use-app-navigate.ts` + 8 files | Wire viewTransition to all navigations |
| 5 | `skeleton.tsx` | Reusable loading primitive |
| 6 | `Settings`, `Invoices`, `Clients` | Meaningful per-page skeleton screens |

**Final verification after all tasks:**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test --run && pnpm --filter @fatturino/web build
```
Expected: All tests pass, build succeeds.
