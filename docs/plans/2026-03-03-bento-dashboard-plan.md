# Bento Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Dashboard page from a uniform grid into a magazine-style bento layout with a hero revenue card, mixed card styles, and responsive breakpoints.

**Architecture:** Single-file rewrite of `Dashboard.tsx`. The bento grid uses CSS Grid with explicit `grid-template-columns` and `col-span`/`row-span` utilities from Tailwind. The hero card embeds a compact Recharts BarChart. No new dependencies needed.

**Tech Stack:** React 18, Tailwind CSS 3.4 (CSS Grid utilities), Recharts (already installed), Lucide icons

---

### Task 1: Rewrite Dashboard layout to bento grid

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx`

**Step 1: Replace the outer layout and summary cards grid**

Replace the current `<div className="space-y-6">` wrapper and `grid gap-4 md:grid-cols-2 lg:grid-cols-4` summary section with a CSS Grid bento layout:

```tsx
<div className="space-y-6">
  {/* Header + profile warning unchanged */}

  {/* Bento grid */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    {/* Hero: Revenue + mini chart — spans 2 cols, 2 rows on lg */}
    <div className="md:col-span-2 lg:row-span-2">
      <HeroRevenueCard ... />
    </div>

    {/* 3 stat cards — each 1 col */}
    <DashboardCard ... /> {/* Sent Invoices */}
    <DashboardCard ... /> {/* Pending Invoices */}
    <DashboardCard ... /> {/* Tax Due */}
  </div>

  {/* Full-width chart card */}
  <Card> ... revenue chart ... </Card>

  {/* Tax breakdown with colored left borders */}
  <div className="grid gap-4 md:grid-cols-3">
    <Card className="border-l-4 border-l-emerald-400"> ... Imposta ... </Card>
    <Card className="border-l-4 border-l-blue-400"> ... INPS ... </Card>
    <Card className="border-l-4 border-l-amber-400"> ... F24 ... </Card>
  </div>

  {/* Recent invoices — unchanged */}
</div>
```

**Step 2: Create the HeroRevenueCard component**

New component inside Dashboard.tsx (no separate file needed):

```tsx
function HeroRevenueCard({
  totalRevenue,
  chartData,
  chartConfig,
  year,
  t,
}: {
  totalRevenue: number;
  chartData: Array<{ month: string; revenue: number }>;
  chartConfig: Record<string, { label: string; color: string }>;
  year: number;
  t: (key: string) => string;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-teal-50 p-6 shadow-md">
      <div>
        <p className="text-sm font-medium text-emerald-700">
          {t("dashboard.totalRevenue")} {year}
        </p>
        <p className="mt-2 text-4xl font-bold tracking-tight font-mono text-[#064E3B]">
          {formatEur(totalRevenue)}
        </p>
      </div>
      {chartData.length > 0 && (
        <div className="mt-4">
          <ChartContainer config={chartConfig} className="h-[150px] w-full">
            <BarChart data={chartData}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Add border-l-4 to tax cards**

Change the 3 tax `<Card>` elements:
- Imposta: `<Card className="border-l-4 border-l-emerald-400">`
- INPS: `<Card className="border-l-4 border-l-blue-400">`
- F24: `<Card className="border-l-4 border-l-amber-400">`

**Step 4: Update loading skeleton to match bento layout**

Replace the 4 equal skeleton rectangles with:
```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
  <div className="h-[240px] rounded-xl bg-secondary animate-skeleton md:col-span-2 lg:row-span-2" />
  <div className="h-[106px] rounded-xl bg-secondary animate-skeleton" />
  <div className="h-[106px] rounded-xl bg-secondary animate-skeleton" />
  <div className="h-[106px] rounded-xl bg-secondary animate-skeleton" />
</div>
```

**Step 5: Build and verify**

Run: `cd /Users/iba/Freelance/fatturino && pnpm --filter @fatturino/web build`
Expected: Build succeeds with no errors.

**Step 6: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx
git commit -m "feat(dashboard): convert to magazine-style bento grid layout"
```
