# Error Handling, Notifications & Logging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add toast notifications, server-side validation error display, structured logging, and a global error boundary so users always see feedback when operations succeed or fail.

**Architecture:** Install shadcn/ui Toast component. Add a `parseApiFieldErrors` utility to map Zod-shaped API errors to form field errors. Add `onError`/`onSuccess` toast callbacks to all 6 mutation hooks. Create a thin structured logger. Wrap routes in an ErrorBoundary. Add E2E tests for error visibility.

**Tech Stack:** shadcn/ui Toast (@radix-ui/react-toast), React, TanStack Query, Vitest, Playwright

---

### Task 1: Install shadcn/ui Toast Component

**Files:**
- Create: `apps/web/src/components/ui/toast.tsx`
- Create: `apps/web/src/components/ui/toaster.tsx`
- Create: `apps/web/src/hooks/use-toast.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/package.json`

**Step 1: Install the radix toast primitive**

```bash
cd apps/web && pnpm add @radix-ui/react-toast
```

**Step 2: Create the Toast component**

Create `apps/web/src/components/ui/toast.tsx` — this is the standard shadcn/ui toast component. Use the exact shadcn/ui implementation:

```tsx
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
))
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

**Step 3: Create the use-toast hook**

Create `apps/web/src/hooks/use-toast.ts` — standard shadcn/ui toast hook:

```ts
import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: ToasterToast["id"] }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: ToasterToast["id"] }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((t) => addToRemoveQueue(t.id))
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()
  const update = (props: ToasterToast) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss() } },
  })

  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [state])

  return { ...state, toast, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) }
}

export { useToast, toast }
```

**Step 4: Create the Toaster component**

Create `apps/web/src/components/ui/toaster.tsx`:

```tsx
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
```

**Step 5: Add Toaster to App.tsx**

In `apps/web/src/App.tsx`, import and render `<Toaster />` as a sibling of `<BrowserRouter>` inside `<QueryClientProvider>`:

```tsx
import { Toaster } from "@/components/ui/toaster";

// Inside the App component return, after </BrowserRouter>:
<Toaster />
```

**Step 6: Verify it builds**

```bash
cd /Users/iba/Freelance/fatturino && pnpm run build
```
Expected: Build succeeds with 0 errors.

**Step 7: Commit**

```bash
git add apps/web/src/components/ui/toast.tsx apps/web/src/components/ui/toaster.tsx apps/web/src/hooks/use-toast.ts apps/web/src/App.tsx apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add shadcn/ui toast notification system"
```

---

### Task 2: Create parseApiFieldErrors Utility and Logger

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/logger.ts`
- Create: `apps/web/src/__tests__/api-errors.test.ts`
- Create: `apps/web/src/__tests__/logger.test.ts`

**Step 1: Write the failing test for parseApiFieldErrors**

Create `apps/web/src/__tests__/api-errors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ApiError, parseApiFieldErrors } from "../lib/api";

describe("parseApiFieldErrors", () => {
  it("should map Zod-shaped details to field errors", () => {
    const error = new ApiError(400, "Validation failed", [
      { validation: "regex", code: "invalid_string", message: "Invalid codice fiscale format", path: ["codiceFiscale"] },
      { validation: "regex", code: "invalid_string", message: "Must be 11 digits", path: ["partitaIva"] },
    ]);

    const result = parseApiFieldErrors(error);

    expect(result).toEqual({
      codiceFiscale: "Invalid codice fiscale format",
      partitaIva: "Must be 11 digits",
    });
  });

  it("should return empty object for non-ApiError", () => {
    const result = parseApiFieldErrors(new Error("Network error"));
    expect(result).toEqual({});
  });

  it("should return empty object when details is not an array", () => {
    const error = new ApiError(500, "Server error");
    const result = parseApiFieldErrors(error);
    expect(result).toEqual({});
  });

  it("should skip entries without path", () => {
    const error = new ApiError(400, "Validation failed", [
      { code: "custom", message: "General error" },
      { code: "invalid_string", message: "Bad field", path: ["nome"] },
    ]);

    const result = parseApiFieldErrors(error);
    expect(result).toEqual({ nome: "Bad field" });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test -- api-errors
```
Expected: FAIL — `parseApiFieldErrors` is not exported.

**Step 3: Implement parseApiFieldErrors**

Add to `apps/web/src/lib/api.ts` at the bottom, before the final `export { ApiError }` line:

```ts
export function parseApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};
  for (const detail of error.details) {
    if (detail && Array.isArray(detail.path) && detail.path.length > 0 && typeof detail.message === "string") {
      fieldErrors[detail.path[0]] = detail.message;
    }
  }
  return fieldErrors;
}
```

Also update the export line: `export { ApiError, parseApiFieldErrors };`

**Step 4: Run test to verify it passes**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test -- api-errors
```
Expected: 4 tests PASS.

**Step 5: Write the failing test for logger**

Create `apps/web/src/__tests__/logger.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("should log error with structured data", () => {
    logger.error("mutation_failed", { mutation: "saveProfile", status: 400 });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("mutation_failed"),
      expect.objectContaining({ mutation: "saveProfile", status: 400 })
    );
  });

  it("should log warn with structured data", () => {
    logger.warn("slow_request", { path: "/api/invoices", ms: 3000 });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("slow_request"),
      expect.objectContaining({ path: "/api/invoices" })
    );
  });

  it("should log info with structured data", () => {
    logger.info("profile_saved", { userId: "u1" });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("profile_saved"),
      expect.objectContaining({ userId: "u1" })
    );
  });
});
```

**Step 6: Implement logger**

Create `apps/web/src/lib/logger.ts`:

```ts
type LogContext = Record<string, unknown>;

function formatEvent(level: string, event: string): string {
  return `[${level.toUpperCase()}] ${event}`;
}

export const logger = {
  error(event: string, context?: LogContext) {
    console.error(formatEvent("error", event), context ?? {});
  },

  warn(event: string, context?: LogContext) {
    console.warn(formatEvent("warn", event), context ?? {});
  },

  info(event: string, context?: LogContext) {
    console.info(formatEvent("info", event), context ?? {});
  },
};
```

**Step 7: Run all tests to verify**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test
```
Expected: All tests pass.

**Step 8: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/lib/logger.ts apps/web/src/__tests__/api-errors.test.ts apps/web/src/__tests__/logger.test.ts
git commit -m "feat: add parseApiFieldErrors utility and structured logger"
```

---

### Task 3: Add Toast Notifications to All Mutation Hooks

**Files:**
- Modify: `apps/web/src/hooks/use-profile.ts`
- Modify: `apps/web/src/hooks/use-clients.ts`
- Modify: `apps/web/src/hooks/use-invoices.ts`

This task adds `onError` callbacks with toast notifications to all 6 mutation hooks. The hooks will also accept an optional `onError` callback so page components can handle field-level errors.

**Step 1: Update useSaveProfile**

In `apps/web/src/hooks/use-profile.ts`, add toast on success and error:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

// ... keep existing interfaces ...

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileFormData) =>
      api.put<UserProfile>("/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile saved", variant: "success" });
    },
    onError: (error) => {
      logger.error("save_profile_failed", { error: error.message });
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
```

**Step 2: Update useCreateClient, useUpdateClient, useDeleteClient**

In `apps/web/src/hooks/use-clients.ts`:

```ts
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
```

Add to `useCreateClient`:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["clients"] });
  toast({ title: "Client created", variant: "success" });
},
onError: (error) => {
  logger.error("create_client_failed", { error: error.message });
  toast({ title: "Error", description: error.message, variant: "destructive" });
},
```

Add to `useUpdateClient`:
```ts
onSuccess: (_, { id }) => {
  queryClient.invalidateQueries({ queryKey: ["clients"] });
  queryClient.invalidateQueries({ queryKey: ["clients", id] });
  toast({ title: "Client updated", variant: "success" });
},
onError: (error) => {
  logger.error("update_client_failed", { error: error.message });
  toast({ title: "Error", description: error.message, variant: "destructive" });
},
```

Add to `useDeleteClient`:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["clients"] });
  toast({ title: "Client deleted", variant: "success" });
},
onError: (error) => {
  logger.error("delete_client_failed", { error: error.message });
  toast({ title: "Error", description: error.message, variant: "destructive" });
},
```

**Step 3: Update useCreateInvoice, useDeleteInvoice**

In `apps/web/src/hooks/use-invoices.ts`:

```ts
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
```

Add to `useCreateInvoice`:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
  toast({ title: "Invoice created", variant: "success" });
},
onError: (error) => {
  logger.error("create_invoice_failed", { error: error.message });
  toast({ title: "Error", description: error.message, variant: "destructive" });
},
```

Add to `useDeleteInvoice`:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
  toast({ title: "Invoice deleted", variant: "success" });
},
onError: (error) => {
  logger.error("delete_invoice_failed", { error: error.message });
  toast({ title: "Error", description: error.message, variant: "destructive" });
},
```

**Step 4: Build to verify**

```bash
cd /Users/iba/Freelance/fatturino && pnpm run build
```
Expected: Build succeeds.

**Step 5: Run unit tests**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test
```
Expected: All tests pass (existing hook tests should still pass since they don't assert against toast).

**Step 6: Commit**

```bash
git add apps/web/src/hooks/use-profile.ts apps/web/src/hooks/use-clients.ts apps/web/src/hooks/use-invoices.ts
git commit -m "feat: add toast notifications to all mutation hooks"
```

---

### Task 4: Wire Server-Side Validation Errors Into Forms

**Files:**
- Modify: `apps/web/src/components/ProfileForm.tsx`
- Modify: `apps/web/src/pages/Settings.tsx`
- Modify: `apps/web/src/components/ClientForm.tsx`
- Modify: `apps/web/src/pages/Clients.tsx`
- Modify: `apps/web/src/components/InvoiceForm.tsx`
- Modify: `apps/web/src/pages/InvoiceEditor.tsx`

**Step 1: Add server error support to ProfileForm**

The ProfileForm currently has no errors state. Add one, and accept an `onServerError` callback pattern. Actually, simpler: accept a `serverErrors` prop.

In `apps/web/src/components/ProfileForm.tsx`:

1. Add `serverErrors` prop to the interface:
```ts
interface ProfileFormProps {
  profile?: UserProfile;
  onSubmit: (data: ProfileFormData) => void;
  isLoading: boolean;
  serverErrors?: Record<string, string>;
}
```

2. Destructure it:
```ts
export function ProfileForm({ profile, onSubmit, isLoading, serverErrors = {} }: ProfileFormProps) {
```

3. Under each `<Input>`, add error display where `serverErrors[fieldName]` exists. Example for codiceFiscale:
```tsx
<Input
  id="codiceFiscale"
  value={codiceFiscale}
  onChange={(e) => setCodiceFiscale(e.target.value)}
  maxLength={16}
  required
/>
{serverErrors.codiceFiscale && (
  <p className="text-sm text-destructive">{serverErrors.codiceFiscale}</p>
)}
```

Add this pattern for each field: `ragioneSociale`, `partitaIva`, `codiceFiscale`, `codiceAteco`, `indirizzo`, `cap`, `citta`, `provincia`, `pec`, `codiceSdi`, `iban`, `annoInizioAttivita`.

**Step 2: Wire Settings.tsx to pass server errors**

In `apps/web/src/pages/Settings.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { ProfileForm } from "@/components/ProfileForm";
import { useProfile, useSaveProfile } from "@/hooks/use-profile";
import { parseApiFieldErrors } from "@/lib/api";
import { useState } from "react";

export function Settings() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const saveProfile = useSaveProfile();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  function handleSubmit(data: Parameters<typeof saveProfile.mutate>[0]) {
    setServerErrors({});
    saveProfile.mutate(data, {
      onError: (error) => {
        setServerErrors(parseApiFieldErrors(error));
      },
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {t("settings.title")}
      </h1>
      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <ProfileForm
          profile={profile}
          onSubmit={handleSubmit}
          isLoading={saveProfile.isPending}
          serverErrors={serverErrors}
        />
      )}
    </div>
  );
}
```

**Step 3: Wire Clients.tsx for server errors on create/edit**

In `apps/web/src/pages/Clients.tsx`, add a `serverErrors` state and pass it to `ClientForm`. Clear errors when dialog opens/closes. Pass errors on mutation `onError`.

Add state:
```ts
const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
```

Update `handleCreate`:
```ts
function handleCreate(data: CreateClientData) {
  setServerErrors({});
  createClient.mutate(data, {
    onSuccess: () => setFormOpen(false),
    onError: (error) => setServerErrors(parseApiFieldErrors(error)),
  });
}
```

Update `handleUpdate`:
```ts
function handleUpdate(data: CreateClientData) {
  if (!editingClient) return;
  setServerErrors({});
  updateClient.mutate(
    { id: editingClient.id, data },
    {
      onSuccess: () => setEditingClient(undefined),
      onError: (error) => setServerErrors(parseApiFieldErrors(error)),
    }
  );
}
```

Clear errors when dialogs close:
```ts
// Create dialog onOpenChange:
<Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setServerErrors({}); }}>

// Edit dialog onOpenChange:
<Dialog open={!!editingClient} onOpenChange={(open) => { if (!open) { setEditingClient(undefined); setServerErrors({}); } }}>
```

Add `serverErrors` prop to both `<ClientForm>` instances:
```tsx
<ClientForm ... serverErrors={serverErrors} />
```

In `apps/web/src/components/ClientForm.tsx`, add the `serverErrors` prop:
```ts
interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
}
```

Merge server errors with client-side errors for display. After each field's existing client-side error, also show server error:
```tsx
{(errors.codiceFiscale || serverErrors?.codiceFiscale) && (
  <p className="text-sm text-destructive">{errors.codiceFiscale || serverErrors?.codiceFiscale}</p>
)}
```

**Step 4: Wire InvoiceEditor.tsx for server errors**

In `apps/web/src/pages/InvoiceEditor.tsx`:

```ts
import { parseApiFieldErrors } from "@/lib/api";
import { useState } from "react";
```

Add state:
```ts
const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
```

Update `handleSubmit`:
```ts
function handleSubmit(data: CreateInvoiceData) {
  setServerErrors({});
  createInvoice.mutate(data, {
    onSuccess: () => navigate("/invoices"),
    onError: (error) => setServerErrors(parseApiFieldErrors(error)),
  });
}
```

Pass to InvoiceForm:
```tsx
<InvoiceForm ... serverErrors={serverErrors} />
```

Update `InvoiceForm` to accept and display `serverErrors` prop (same pattern as ClientForm).

**Step 5: Build and run tests**

```bash
cd /Users/iba/Freelance/fatturino && pnpm run build && pnpm --filter @fatturino/web test
```
Expected: All pass.

**Step 6: Commit**

```bash
git add apps/web/src/components/ProfileForm.tsx apps/web/src/pages/Settings.tsx apps/web/src/components/ClientForm.tsx apps/web/src/pages/Clients.tsx apps/web/src/components/InvoiceForm.tsx apps/web/src/pages/InvoiceEditor.tsx
git commit -m "feat: wire server-side validation errors into all forms"
```

---

### Task 5: Global Error Boundary

**Files:**
- Create: `apps/web/src/components/ErrorBoundary.tsx`
- Modify: `apps/web/src/App.tsx`

**Step 1: Create ErrorBoundary component**

Create `apps/web/src/components/ErrorBoundary.tsx`:

```tsx
import { Component, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("unhandled_component_error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">An unexpected error occurred.</p>
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Step 2: Wrap routes in App.tsx**

In `apps/web/src/App.tsx`, import `ErrorBoundary` and wrap `<BrowserRouter>`:

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

// In return:
<QueryClientProvider client={queryClient}>
  <ErrorBoundary>
    <BrowserRouter>
      ...
    </BrowserRouter>
  </ErrorBoundary>
  <Toaster />
</QueryClientProvider>
```

**Step 3: Build to verify**

```bash
cd /Users/iba/Freelance/fatturino && pnpm run build
```
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/web/src/components/ErrorBoundary.tsx apps/web/src/App.tsx
git commit -m "feat: add global error boundary with fallback UI"
```

---

### Task 6: Add i18n Keys for Toast Messages

**Files:**
- Modify: `apps/web/src/i18n/en.json`
- Modify: `apps/web/src/i18n/it.json`

**Step 1: Add toast-related i18n keys**

In `apps/web/src/i18n/en.json`, add a `"toast"` section:

```json
"toast": {
  "profileSaved": "Profile saved",
  "clientCreated": "Client created",
  "clientUpdated": "Client updated",
  "clientDeleted": "Client deleted",
  "invoiceCreated": "Invoice created",
  "invoiceDeleted": "Invoice deleted",
  "validationFailed": "Validation failed",
  "operationFailed": "Operation failed",
  "unexpectedError": "An unexpected error occurred"
}
```

In `apps/web/src/i18n/it.json`, add the Italian translations:

```json
"toast": {
  "profileSaved": "Profilo salvato",
  "clientCreated": "Cliente creato",
  "clientUpdated": "Cliente aggiornato",
  "clientDeleted": "Cliente eliminato",
  "invoiceCreated": "Fattura creata",
  "invoiceDeleted": "Fattura eliminata",
  "validationFailed": "Validazione fallita",
  "operationFailed": "Operazione fallita",
  "unexpectedError": "Si è verificato un errore imprevisto"
}
```

**Step 2: Update hook toast calls to use i18n**

The toast calls in the hooks (Task 3) currently use hardcoded English strings. Since hooks cannot use `useTranslation()`, use `i18next.t()` directly:

In each hook file, add:
```ts
import i18next from "i18next";
```

Then replace hardcoded strings:
- `"Profile saved"` → `i18next.t("toast.profileSaved")`
- `"Client created"` → `i18next.t("toast.clientCreated")`
- etc.

**Step 3: Build and verify**

```bash
cd /Users/iba/Freelance/fatturino && pnpm run build
```
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/web/src/i18n/en.json apps/web/src/i18n/it.json apps/web/src/hooks/use-profile.ts apps/web/src/hooks/use-clients.ts apps/web/src/hooks/use-invoices.ts
git commit -m "feat: add i18n keys for toast messages"
```

---

### Task 7: E2E Tests for Error Visibility

**Files:**
- Create: `e2e/error-handling.spec.ts`

**Step 1: Write E2E tests**

Create `e2e/error-handling.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers";

test.describe("Error Handling & Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, "errors");
  });

  test("should show toast on successful profile save", async ({ page }) => {
    // First complete the profile
    await page.goto("/settings");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    await page.fill('input[id="ragioneSociale"]', "Test Business");
    await page.fill('input[id="partitaIva"]', "12345678901");
    await page.fill('input[id="codiceFiscale"]', "TSTBSN80A01H501Z");
    await page.fill('input[id="codiceAteco"]', "62.01.00");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.fill('input[id="annoInizioAttivita"]', "2020");

    await page.click('button[type="submit"]');

    // Toast should appear
    await expect(page.locator('[data-radix-toast-viewport] li')).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast and inline error on profile validation failure", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("form")).toBeVisible({ timeout: 5_000 });

    // Submit with invalid codice fiscale format (too short)
    await page.fill('input[id="ragioneSociale"]', "Test Business");
    await page.fill('input[id="partitaIva"]', "12345678901");
    await page.fill('input[id="codiceFiscale"]', "INVALID");
    await page.fill('input[id="codiceAteco"]', "62.01.00");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.fill('input[id="annoInizioAttivita"]', "2020");

    await page.click('button[type="submit"]');

    // Toast should show error
    await expect(page.locator('[data-radix-toast-viewport] li')).toBeVisible({ timeout: 5_000 });

    // Inline error should appear under the codiceFiscale field
    await expect(page.locator('form .text-destructive')).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast on successful client creation", async ({ page }) => {
    await page.goto("/clients");
    await page.click('button:has-text("New Client")');

    await page.fill('input[id="ragioneSociale"]', "Toast Test Srl");
    await page.fill('input[id="codiceFiscale"]', "99999999999");
    await page.fill('input[id="partitaIva"]', "99999999999");
    await page.fill('input[id="indirizzo"]', "Via Test 1");
    await page.fill('input[id="cap"]', "00100");
    await page.fill('input[id="citta"]', "Roma");
    await page.fill('input[id="provincia"]', "RM");
    await page.click('[role="dialog"] button[type="submit"]');

    // Toast should appear for success
    await expect(page.locator('[data-radix-toast-viewport] li')).toBeVisible({ timeout: 5_000 });
  });

  test("should show toast on delete invoice failure", async ({ page }) => {
    // Mock the DELETE to fail
    await page.route("**/api/invoices/*", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Only draft invoices can be deleted" }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET /api/invoices to return a draft invoice
    await page.route("**/api/invoices", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{
            id: "mock-id",
            numeroFattura: 1,
            anno: 2026,
            stato: "bozza",
            clientId: "mock-client",
            dataEmissione: "2026-01-01",
            totaleDocumento: "100.00",
            imponibile: "100.00",
            impostaBollo: "2.00",
          }]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/invoices");
    await expect(page.locator("table")).toBeVisible({ timeout: 5_000 });

    // Click delete
    await page.click('button[aria-label="Delete"]');
    await page.click('[role="alertdialog"] button:has-text("Delete")');

    // Toast should show error
    await expect(page.locator('[data-radix-toast-viewport] li')).toBeVisible({ timeout: 5_000 });
  });
});
```

**Step 2: Commit**

```bash
git add e2e/error-handling.spec.ts
git commit -m "test(e2e): add E2E tests for error handling and toast notifications"
```

---

### Task 8: Final Integration Verification

**Step 1: Run full build**

```bash
cd /Users/iba/Freelance/fatturino && pnpm run build
```
Expected: 4/4 packages build successfully.

**Step 2: Run unit tests**

```bash
cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web test
```
Expected: All tests pass.

**Step 3: Run lint**

```bash
cd /Users/iba/Freelance/fatturino && pnpm run lint
```
Expected: No errors.

**Step 4: Verify clean git status**

```bash
git status
```
Expected: Clean working tree.
