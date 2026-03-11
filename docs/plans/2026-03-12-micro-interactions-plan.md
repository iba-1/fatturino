# Micro-Interactions & Loading States Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add smooth, elegant micro-interactions and loading states across the Fatturino web app using framer-motion.

**Architecture:** Shared motion variants in `lib/motion.ts`, enhanced `Button` with loading prop, `PageTransition` wrapper for route fades, toast animation improvements, and per-page card/list stagger animations.

**Tech Stack:** framer-motion, tailwindcss-animate (existing), Lucide icons (existing), React 19

---

### Task 1: Install framer-motion and create motion config

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/motion.ts`

**Step 1: Install framer-motion**

Run: `cd apps/web && pnpm add framer-motion`

**Step 2: Create shared motion variants**

Create `apps/web/src/lib/motion.ts`:

```typescript
import { type Variants, type Transition } from "framer-motion";

// Smooth & elegant timing
export const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

export const easeOut: Transition = {
  duration: 0.25,
  ease: [0.0, 0.0, 0.2, 1],
};

// Page fade (used by PageTransition)
export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

// Fade + slight slide up (cards appearing)
export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Scale in (modals, popovers)
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
};

// Stagger container — wraps children that each have fadeSlideUp
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Stagger item (use with staggerContainer parent)
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Error shake (for form validation)
export const shake: Variants = {
  initial: {},
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.4 },
  },
};
```

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/src/lib/motion.ts
git commit -m "feat: install framer-motion and create shared motion variants"
```

---

### Task 2: Upgrade Button with loading prop

**Files:**
- Modify: `apps/web/src/components/ui/button.tsx`

**Step 1: Add loading prop to Button**

Modify `apps/web/src/components/ui/button.tsx` to add a `loading` prop that shows a spinner and disables the button:

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-[hsl(156,60%,58%)]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-card hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ui/button.tsx
git commit -m "feat: add loading prop to Button component with spinner"
```

---

### Task 3: Update forms to use Button loading prop

**Files:**
- Modify: `apps/web/src/components/InvoiceForm.tsx` (lines 329-331)
- Modify: `apps/web/src/components/ProfileForm.tsx` (lines 281-283)
- Modify: `apps/web/src/components/ClientForm.tsx` (lines 290-292)
- Modify: `apps/web/src/pages/Login.tsx` (lines 66-68)
- Modify: `apps/web/src/pages/Register.tsx` (similar pattern)
- Modify: `apps/web/src/pages/InvoiceDetail.tsx` (lines 126-133, 138-143, etc.)
- Modify: `apps/web/src/pages/Taxes.tsx` (lines 352-357)

**Step 1: Update InvoiceForm submit button**

In `apps/web/src/components/InvoiceForm.tsx`, change the submit button from:
```tsx
<Button type="submit" disabled={isLoading} data-testid="btn-submit-invoice">
  {isLoading ? t("common.loading") : initialData ? t("common.save") : t("common.create")}
</Button>
```
to:
```tsx
<Button type="submit" loading={isLoading} data-testid="btn-submit-invoice">
  {initialData ? t("common.save") : t("common.create")}
</Button>
```

**Step 2: Update ProfileForm submit button**

In `apps/web/src/components/ProfileForm.tsx`, change:
```tsx
<Button type="submit" disabled={isLoading} data-testid="btn-submit-profile">
  {isLoading ? t("common.loading") : t("common.save")}
</Button>
```
to:
```tsx
<Button type="submit" loading={isLoading} data-testid="btn-submit-profile">
  {t("common.save")}
</Button>
```

**Step 3: Update ClientForm submit button**

In `apps/web/src/components/ClientForm.tsx`, change:
```tsx
<Button type="submit" disabled={isLoading} data-testid="btn-submit-client">
  {isLoading ? t("common.loading") : isEdit ? t("common.save") : t("common.create")}
</Button>
```
to:
```tsx
<Button type="submit" loading={isLoading} data-testid="btn-submit-client">
  {isEdit ? t("common.save") : t("common.create")}
</Button>
```

**Step 4: Update Login button**

In `apps/web/src/pages/Login.tsx`, change:
```tsx
<Button type="submit" disabled={loading} className="w-full">
  {loading ? t("common.loading") : t("auth.login")}
</Button>
```
to:
```tsx
<Button type="submit" loading={loading} className="w-full">
  {t("auth.login")}
</Button>
```

**Step 5: Update Register button** (same pattern as Login)

**Step 6: Update InvoiceDetail action buttons**

In `apps/web/src/pages/InvoiceDetail.tsx`, change the send button:
```tsx
<Button
  variant="default"
  onClick={() => setShowSendConfirm(true)}
  disabled={!hasProfile || sendInvoice.isPending}
>
  <Send className="h-4 w-4 mr-2" />
  {sendInvoice.isPending ? t("common.loading") : t("invoices.send")}
</Button>
```
to:
```tsx
<Button
  variant="default"
  onClick={() => setShowSendConfirm(true)}
  disabled={!hasProfile}
  loading={sendInvoice.isPending}
>
  <Send className="h-4 w-4 mr-2" />
  {t("invoices.send")}
</Button>
```

Apply same pattern to markSent, markPaid, delete, createCreditNote buttons.

**Step 7: Update Taxes payment confirm button**

In `apps/web/src/pages/Taxes.tsx`, change the manual button (line ~352-357) to use the `Button` component with `loading` prop instead of a plain `<button>`.

**Step 8: Commit**

```bash
git add apps/web/src/components/InvoiceForm.tsx apps/web/src/components/ProfileForm.tsx apps/web/src/components/ClientForm.tsx apps/web/src/pages/Login.tsx apps/web/src/pages/Register.tsx apps/web/src/pages/InvoiceDetail.tsx apps/web/src/pages/Taxes.tsx
git commit -m "feat: use Button loading prop across all forms and action buttons"
```

---

### Task 4: Create PageTransition component and add to Layout

**Files:**
- Create: `apps/web/src/components/PageTransition.tsx`
- Modify: `apps/web/src/components/Layout.tsx` (line 119-123)

**Step 1: Create PageTransition wrapper**

Create `apps/web/src/components/PageTransition.tsx`:

```typescript
import { motion } from "framer-motion";
import { pageFade } from "@/lib/motion";
import { useLocation } from "react-router-dom";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      variants={pageFade}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}
```

Note: We use key-based remounting (no AnimatePresence exit) for simplicity. The fade-in on mount is sufficient for a clean feel without the complexity of exit animations with react-router's `<Outlet>`.

**Step 2: Wrap Outlet in Layout with PageTransition**

In `apps/web/src/components/Layout.tsx`, change:
```tsx
<main className="flex-1 p-6 lg:p-8">
  <div className="mx-auto max-w-[1200px]">
    <Outlet />
  </div>
</main>
```
to:
```tsx
<main className="flex-1 p-6 lg:p-8">
  <div className="mx-auto max-w-[1200px]">
    <PageTransition>
      <Outlet />
    </PageTransition>
  </div>
</main>
```

Add import: `import { PageTransition } from "@/components/PageTransition";`

**Step 3: Commit**

```bash
git add apps/web/src/components/PageTransition.tsx apps/web/src/components/Layout.tsx
git commit -m "feat: add page fade transition on route changes"
```

---

### Task 5: Add toast animation improvements

**Files:**
- Modify: `apps/web/src/components/ui/toast.tsx` (line 25)
- Modify: `apps/web/src/components/ui/toaster.tsx`
- Modify: `apps/web/src/hooks/use-toast.ts`

**Step 1: Improve toast entrance/exit animations**

In `apps/web/src/components/ui/toast.tsx`, the Radix toast already has `data-[state=open]:slide-in-from-top-full`. We enhance with spring-like timing by adding custom transition classes. Replace the existing toast variant base class string (line 25) to use smoother timing:

Change the base class string in `toastVariants`:
```
data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full
```
to:
```
data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:duration-300 data-[state=closed]:duration-200
```

**Step 2: Add auto-dismiss progress bar to Toaster**

In `apps/web/src/components/ui/toaster.tsx`, add a progress bar inside each toast:

```tsx
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} data-testid="toast" {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            {/* Auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl">
              <div
                className="h-full bg-current opacity-20 animate-toast-progress"
                style={{ animationDuration: "5000ms" }}
              />
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
```

**Step 3: Add toast-progress keyframe to tailwind config**

In `apps/web/tailwind.config.js`, add to keyframes:

```javascript
"toast-progress": {
  from: { width: "100%" },
  to: { width: "0%" },
},
```

And to animation:
```javascript
"toast-progress": "toast-progress linear forwards",
```

**Step 4: Commit**

```bash
git add apps/web/src/components/ui/toast.tsx apps/web/src/components/ui/toaster.tsx apps/web/tailwind.config.js
git commit -m "feat: improve toast animations with spring timing and progress bar"
```

---

### Task 6: Dashboard micro-interactions (staggered cards, hover, count-up)

**Files:**
- Create: `apps/web/src/components/CountUp.tsx`
- Modify: `apps/web/src/pages/Dashboard.tsx`

**Step 1: Create CountUp component**

Create `apps/web/src/components/CountUp.tsx`:

```typescript
import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  formatter?: (n: number) => string;
  className?: string;
}

export function CountUp({ end, duration = 800, formatter, className }: CountUpProps) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;

    function step(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * end);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(step);
      }
    }

    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [end, duration]);

  const display = formatter ? formatter(current) : Math.round(current).toString();

  return <span className={className}>{display}</span>;
}
```

**Step 2: Add stagger and hover animations to Dashboard**

Modify `apps/web/src/pages/Dashboard.tsx`:

1. Add imports:
```typescript
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { CountUp } from "@/components/CountUp";
```

2. Wrap the bento grid with `motion.div` stagger container:
Replace the grid `<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">` with:
```tsx
<motion.div
  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
  variants={staggerContainer}
  initial="initial"
  animate="animate"
  data-testid="summary-cards"
>
```

3. Wrap each card child (HeroRevenueCard and DashboardCards) with `motion.div variants={staggerItem}`:
```tsx
<motion.div variants={staggerItem} className="md:col-span-2 lg:row-span-2">
  <HeroRevenueCard ... />
</motion.div>
<motion.div variants={staggerItem}>
  <DashboardCard ... />
</motion.div>
```

4. In `DashboardCard`, add hover lift effect:
```tsx
<Card className="transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md">
```

5. For the HeroRevenueCard total revenue, use CountUp:
Replace `{formatEur(totalRevenue)}` with:
```tsx
<CountUp end={totalRevenue} formatter={formatEur} />
```

6. Wrap tax breakdown cards grid with stagger:
```tsx
<motion.div
  className="grid gap-4 md:grid-cols-3"
  variants={staggerContainer}
  initial="initial"
  animate="animate"
>
  <motion.div variants={staggerItem}>
    <Card className="border-l-4 border-l-emerald-400 ...">
    ...
  </motion.div>
  ...
</motion.div>
```

7. Add hover highlight to recent invoices table rows:
```tsx
className="cursor-pointer border-b last:border-0 transition-colors duration-200 hover:bg-muted/50"
```
(Already has hover:bg-muted/50, just ensure transition-colors duration-200 is there)

**Step 3: Commit**

```bash
git add apps/web/src/components/CountUp.tsx apps/web/src/pages/Dashboard.tsx
git commit -m "feat: add staggered card animations, hover lift, and count-up to Dashboard"
```

---

### Task 7: Invoices page micro-interactions

**Files:**
- Modify: `apps/web/src/pages/Invoices.tsx`

**Step 1: Add stagger to invoice table rows**

In `apps/web/src/pages/Invoices.tsx`:

1. Add imports:
```typescript
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeSlideUp } from "@/lib/motion";
```

2. Wrap `<TableBody>` with `motion` and add stagger:
```tsx
<TableBody
  as={motion.tbody}
  variants={staggerContainer}
  initial="initial"
  animate="animate"
>
```

Note: Since shadcn's `TableBody` uses `forwardRef`, we can't use `as` prop. Instead, wrap each `TableRow` content with motion:

Actually, the simpler approach: wrap the table section in a motion div:
```tsx
<motion.div variants={fadeSlideUp} initial="initial" animate="animate">
  <Table>
    ...
  </Table>
</motion.div>
```

3. Animate empty state icon with a gentle bounce-in:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
  className="text-center py-16"
  data-testid="empty-state"
>
  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
  ...
</motion.div>
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Invoices.tsx
git commit -m "feat: add fade-in animations and empty state bounce to Invoices"
```

---

### Task 8: Clients page micro-interactions

**Files:**
- Modify: `apps/web/src/pages/Clients.tsx`

**Step 1: Add animations (same pattern as Invoices)**

1. Add framer-motion imports
2. Wrap table with `fadeSlideUp` animation
3. Animate empty state with bounce-in

**Step 2: Commit**

```bash
git add apps/web/src/pages/Clients.tsx
git commit -m "feat: add fade-in animations and empty state bounce to Clients"
```

---

### Task 9: Remaining pages micro-interactions

**Files:**
- Modify: `apps/web/src/pages/Taxes.tsx`
- Modify: `apps/web/src/pages/TaxSimulator.tsx`
- Modify: `apps/web/src/pages/Settings.tsx`
- Modify: `apps/web/src/pages/InvoiceDetail.tsx`
- Modify: `apps/web/src/pages/InvoiceEditor.tsx`

**Step 1: Taxes page**

Wrap tax breakdown cards grid with stagger animation (same pattern as Dashboard).
Wrap payment schedule rows with stagger.

**Step 2: Settings page**

Wrap the profile form appearance with `fadeSlideUp`:
```tsx
<motion.div variants={fadeSlideUp} initial="initial" animate="animate">
  <ProfileForm ... />
</motion.div>
```

**Step 3: InvoiceDetail page**

Wrap action bar and preview with `fadeSlideUp`.

**Step 4: InvoiceEditor page**

Wrap form with `fadeSlideUp`.

**Step 5: TaxSimulator page**

Wrap result cards with stagger animation.

**Step 6: Commit**

```bash
git add apps/web/src/pages/Taxes.tsx apps/web/src/pages/TaxSimulator.tsx apps/web/src/pages/Settings.tsx apps/web/src/pages/InvoiceDetail.tsx apps/web/src/pages/InvoiceEditor.tsx
git commit -m "feat: add micro-interactions to Taxes, Settings, InvoiceDetail, InvoiceEditor, TaxSimulator"
```

---

### Task 10: Form error shake animation

**Files:**
- Modify: `apps/web/src/components/InvoiceForm.tsx`
- Modify: `apps/web/src/components/ClientForm.tsx`
- Modify: `apps/web/src/components/ProfileForm.tsx`

**Step 1: Add error message fade-in**

For error messages in forms, wrap with motion for a subtle fade-in:

```tsx
import { AnimatePresence, motion } from "framer-motion";

// Replace error display pattern:
{(errors.fieldName || serverErrors.fieldName) && (
  <p className="text-sm text-destructive">...</p>
)}

// With:
<AnimatePresence>
  {(errors.fieldName || serverErrors.fieldName) && (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="text-sm text-destructive"
    >
      {errors.fieldName || serverErrors.fieldName}
    </motion.p>
  )}
</AnimatePresence>
```

Apply to all error message locations across the three form components.

**Step 2: Commit**

```bash
git add apps/web/src/components/InvoiceForm.tsx apps/web/src/components/ClientForm.tsx apps/web/src/components/ProfileForm.tsx
git commit -m "feat: add fade-in animation to form error messages"
```

---

### Task 11: Skeleton-to-content crossfade

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx`
- Modify: `apps/web/src/pages/Invoices.tsx`
- Modify: `apps/web/src/pages/Clients.tsx`
- Modify: `apps/web/src/pages/Settings.tsx`

**Step 1: Add AnimatePresence for skeleton→content transition**

In pages that show skeletons, wrap the loading/loaded content switch with AnimatePresence:

```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="wait">
  {isLoading ? (
    <motion.div
      key="skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <SkeletonComponent />
    </motion.div>
  ) : (
    <motion.div
      key="content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* actual content */}
    </motion.div>
  )}
</AnimatePresence>
```

Apply to Dashboard (summary cards), Invoices (table), Clients (table), Settings (profile form).

**Step 2: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx apps/web/src/pages/Invoices.tsx apps/web/src/pages/Clients.tsx apps/web/src/pages/Settings.tsx
git commit -m "feat: add smooth crossfade from skeleton to content"
```

---

### Task 12: Type-check and build verification

**Step 1: Run type-check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 2: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Fix any issues**

If type or build errors, fix them.

**Step 4: Commit fixes if any**

---

### Task 13: Run existing tests

**Step 1: Run tests**

Run: `pnpm test`
Expected: All existing tests pass

**Step 2: Fix any broken tests**

If tests fail due to animation wrappers (e.g., missing motion mocks), add a framer-motion mock in test setup:

```typescript
// In vitest setup or test file
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => React.forwardRef((props, ref) => React.createElement(tag as string, { ...props, ref })),
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({ start: vi.fn() }),
}));
```

**Step 3: Commit fixes if any**

---

## Parallel Decomposition for Team Feature

This plan can be split into **3 parallel streams** after Task 1 (foundation):

### Stream A: Button & Forms (Tasks 2, 3, 10)
- **Owner:** implementer-1
- **Files:** `button.tsx`, `InvoiceForm.tsx`, `ProfileForm.tsx`, `ClientForm.tsx`, `Login.tsx`, `Register.tsx`

### Stream B: Page Transitions & Toast (Tasks 4, 5)
- **Owner:** implementer-2
- **Files:** `PageTransition.tsx`, `Layout.tsx`, `toast.tsx`, `toaster.tsx`, `use-toast.ts`, `tailwind.config.js`

### Stream C: Page Animations (Tasks 6, 7, 8, 9, 11)
- **Owner:** implementer-3
- **Files:** `CountUp.tsx`, `Dashboard.tsx`, `Invoices.tsx`, `Clients.tsx`, `Taxes.tsx`, `TaxSimulator.tsx`, `Settings.tsx`, `InvoiceDetail.tsx`, `InvoiceEditor.tsx`

Tasks 12-13 (verification) run after all streams complete.
