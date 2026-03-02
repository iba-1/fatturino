# Error Handling, Notifications & Logging — Design

## Problem

API errors are silently swallowed. When a user submits a form and the server returns a validation error (e.g. invalid codice fiscale), nothing happens in the UI — no toast, no inline error, no feedback. The button stays in a loading/frozen state.

Example API response that goes unshown:
```json
{
  "error": "Validation failed",
  "details": [
    { "validation": "regex", "code": "invalid_string", "message": "Invalid codice fiscale format", "path": ["codiceFiscale"] }
  ]
}
```

## Decisions

| Decision | Choice |
|----------|--------|
| Toast library | shadcn/ui Toast (useToast + Toaster) |
| Validation errors | Toast summary + inline field errors |
| Logging | Structured console logger (swappable to Sentry later) |
| Error boundary | Yes — global, with fallback UI |

## Design

### 1. Toast Notification Layer

Add shadcn/ui Toast: `useToast` hook + `<Toaster />` in App.tsx.

All mutations get toast feedback:
- **Success**: "Profile saved", "Client created", "Invoice deleted", etc.
- **Error (generic)**: Red toast with API error message
- **Error (validation)**: Red toast summary + inline field errors in form

### 2. API Error → Form Field Mapping

Utility `parseApiFieldErrors(error: unknown)` in `lib/api.ts`:
- Checks if error is `ApiError` with `details` array
- Maps `{ path: ["fieldName"], message: "..." }` entries to `{ [fieldName]: message }`
- Returns `Record<string, string>` for direct use in form error state

### 3. Mutation Hook Pattern

Every mutation gets `onError` alongside existing `onSuccess`:
- `onError`: show toast + parse validation details
- Page components pass `onServerError` callback to forms for field-level error display
- Forms set their `errors` state from both client-side validation and server-side API errors

Affected mutations: `useSaveProfile`, `useCreateClient`, `useUpdateClient`, `useDeleteClient`, `useCreateInvoice`, `useDeleteInvoice`.

### 4. Structured Logger

`lib/logger.ts`:
- `logger.error(event, context)`, `logger.warn(event, context)`, `logger.info(event, context)`
- Outputs structured JSON to console
- Used in: mutation onError, error boundary, API client
- Designed to swap transport to Sentry/Datadog later

### 5. Global Error Boundary

`components/ErrorBoundary.tsx` — class component wrapping app routes:
- Catches unhandled React errors
- Shows styled "Something went wrong" fallback with retry button
- Logs crash via `logger.error`

### 6. Tests

- **Unit**: `parseApiFieldErrors` maps Zod-shaped details to field error records
- **Hook**: Mutations call toast on error, pass field errors through callback
- **E2E**: Profile with invalid codice fiscale → toast + inline error. Client creation failure → error displayed. Delete failure → toast shown.
