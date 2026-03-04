# Fix Protected Routes — Design

**Date:** 2026-03-04
**Branch:** `worktree-fix-protected-routes`
**Approach:** ProtectedRoute wrapper + global 401 interceptor

## Problem

1. Unauthenticated users can visit any page (dashboard, invoices, etc.) — no redirect to `/login`
2. When session expires mid-use, API calls fail with 401 but user stays on broken page

## Solution

### 1. `ProtectedRoute` component

- Wraps all authenticated routes in `App.tsx`
- Calls `useSession()` from Better Auth
- While loading: shows spinner/skeleton
- If no session: redirects to `/login`
- If authenticated: renders `<Outlet />`

### 2. Global 401 interceptor in `api.ts`

- After any API response, check for 401 status
- On 401: redirect to `/login` via `window.location.href`
- Handles session expiry mid-use

### 3. Reverse guard on auth pages

- `/login` and `/register` check `useSession()`
- If already authenticated: redirect to `/`
- Prevents logged-in users from seeing login form

## Files to modify

- `apps/web/src/components/ProtectedRoute.tsx` — new (~15 lines)
- `apps/web/src/App.tsx` — wrap protected routes
- `apps/web/src/lib/api.ts` — add 401 interceptor
- `apps/web/src/pages/Login.tsx` — add reverse guard
- `apps/web/src/pages/Register.tsx` — add reverse guard
