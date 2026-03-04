# Fix Protected Routes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent unauthenticated users from accessing protected pages and handle session expiry gracefully.

**Architecture:** Add a `ProtectedRoute` component that gates all authenticated routes using Better Auth's `useSession()`. Add a global 401 interceptor in the API client to redirect on session expiry. Add reverse guards on login/register to redirect authenticated users home.

**Tech Stack:** React Router v6, Better Auth (`useSession`), existing `api.ts` client

---

### Task 1: Create ProtectedRoute component

**Files:**
- Create: `apps/web/src/components/ProtectedRoute.tsx`

**Step 1: Create the ProtectedRoute component**

```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "@/lib/auth";

export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ProtectedRoute.tsx
git commit -m "feat: add ProtectedRoute component with session guard"
```

---

### Task 2: Wire ProtectedRoute into App.tsx

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Wrap protected routes with ProtectedRoute**

Add import:
```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";
```

Change the route tree from:
```tsx
<Route path="/" element={<Layout />}>
```

To:
```tsx
<Route path="/" element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="invoices" element={<Invoices />} />
    <Route path="invoices/new" element={<InvoiceEditor />} />
    <Route path="invoices/:id" element={<InvoiceDetail />} />
    <Route path="invoices/:id/edit" element={<InvoiceEditor />} />
    <Route path="clients" element={<Clients />} />
    <Route path="taxes" element={<Taxes />} />
    <Route path="taxes/simulator" element={<TaxSimulator />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Route>
```

Note: `ProtectedRoute` renders `<Outlet />` which renders `<Layout />` which also renders `<Outlet />` for child routes. This nested outlet pattern is standard React Router.

**Step 2: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat: wrap protected routes with ProtectedRoute guard"
```

---

### Task 3: Add global 401 interceptor in api.ts

**Files:**
- Modify: `apps/web/src/lib/api.ts`

**Step 1: Add 401 redirect before throwing ApiError**

In the `request()` function, after `if (!response.ok)`, add a 401 check before the existing error throw:

```ts
if (!response.ok) {
  if (response.status === 401) {
    window.location.href = "/login";
    return new Promise(() => {}); // Hang the promise — page is redirecting
  }

  const body = await response.json().catch(() => ({}));
  throw new ApiError(
    response.status,
    body.error || body.message || `Request failed with status ${response.status}`,
    body.details
  );
}
```

Also add the same check in `downloadFile()`:

```ts
if (!response.ok) {
  if (response.status === 401) {
    window.location.href = "/login";
    return new Promise(() => {});
  }
  // ... existing error handling
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "feat: add global 401 interceptor to redirect on session expiry"
```

---

### Task 4: Add reverse guards on Login and Register pages

**Files:**
- Modify: `apps/web/src/pages/Login.tsx`
- Modify: `apps/web/src/pages/Register.tsx`

**Step 1: Add redirect if already authenticated to Login.tsx**

Add import:
```tsx
import { signIn, useSession } from "@/lib/auth";
```

Add at the top of the `Login` component body:
```tsx
const { data: session, isPending } = useSession();

if (isPending) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

if (session) {
  return <Navigate to="/" replace />;
}
```

Add to imports from react-router-dom:
```tsx
import { Link, useNavigate, Navigate } from "react-router-dom";
```

**Step 2: Apply the same pattern to Register.tsx**

Add import:
```tsx
import { signUp, useSession } from "@/lib/auth";
```

Add at the top of the `Register` component body:
```tsx
const { data: session, isPending } = useSession();

if (isPending) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

if (session) {
  return <Navigate to="/" replace />;
}
```

Add to imports from react-router-dom:
```tsx
import { Link, useNavigate, Navigate } from "react-router-dom";
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/Login.tsx apps/web/src/pages/Register.tsx
git commit -m "feat: add reverse auth guards on login and register pages"
```

---

### Task 5: Manual smoke test

**Step 1: Start the dev server**

```bash
pnpm dev
```

**Step 2: Test protected routes**

1. Open browser in incognito → go to `http://localhost:5173/invoices`
2. Expected: redirected to `/login`
3. Go to `http://localhost:5173/` → redirected to `/login`

**Step 3: Test reverse guards**

1. Log in with valid credentials
2. Navigate to `/login` manually
3. Expected: redirected to `/`

**Step 4: Test session expiry**

1. Log in, navigate to invoices
2. Clear cookies in browser dev tools
3. Trigger any API call (e.g., create invoice)
4. Expected: redirected to `/login`

---

### Task 6: Build check

**Step 1: Run TypeScript build**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: no errors.

**Step 2: Commit any fixes if needed**
