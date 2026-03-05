import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import {
  Send,
  Clock,
  ChevronRight,
  Calculator,
  TrendingUp,
  Wallet,
  Euro,
  Receipt,
  PiggyBank,
  CalendarClock,
} from "lucide-react";

const formatEur = (n: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const formatEurFull = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

/** Format number for LED display (no currency symbol) */
function ledNumber(n: number, decimals = 0): string {
  return n.toLocaleString("it-IT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ─── Mini SVG Visualizations ─────────────────────────────── */

function MiniLineChart({
  data,
  color = "rgba(255,255,255,0.8)",
  height = 48,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height * 0.8) - height * 0.1;
    return `${x},${y}`;
  });
  const lastPoint = points[points.length - 1].split(",");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`lc-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill={color} />
    </svg>
  );
}

function MiniBarChart({
  data,
  color = "rgba(255,255,255,0.6)",
  height = 32,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barWidth = Math.max(4, (width / data.length) * 0.6);
  const gap = (width - barWidth * data.length) / Math.max(data.length - 1, 1);
  return (
    <svg width={width} height={height}>
      {data.map((v, i) => {
        const barH = (v / max) * height * 0.9;
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barH}
            width={barWidth}
            height={barH}
            rx={2}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

function ArcGauge({
  value,
  max,
  color = "rgba(255,255,255,0.8)",
  size = 56,
}: {
  value: number;
  max: number;
  color?: string;
  size?: number;
}) {
  const pct = Math.min(value / Math.max(max, 1), 1);
  const r = (size - 6) / 2;
  const circumference = Math.PI * r; // semicircle
  const offset = circumference * (1 - pct);
  return (
    <svg width={size} height={size / 2 + 4} className="overflow-visible">
      <path
        d={`M 3,${size / 2} A ${r},${r} 0 0 1 ${size - 3},${size / 2}`}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d={`M 3,${size / 2} A ${r},${r} 0 0 1 ${size - 3},${size / 2}`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function DotMatrix({
  filled,
  total,
  color = "rgba(255,255,255,0.7)",
  cols = 6,
}: {
  filled: number;
  total: number;
  color?: string;
  cols?: number;
}) {
  const rows = Math.ceil(total / cols);
  return (
    <svg width={cols * 10} height={rows * 10}>
      {Array.from({ length: total }, (_, i) => {
        const x = (i % cols) * 10 + 4;
        const y = Math.floor(i / cols) * 10 + 4;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill={i < filled ? color : "rgba(255,255,255,0.12)"}
          />
        );
      })}
    </svg>
  );
}

/* ─── Card Wrapper ────────────────────────────────────────── */

interface GlassCardProps {
  gradient: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function GlassCard({ gradient, children, className = "", onClick }: GlassCardProps) {
  return (
    <div
      className={`v2-glass-card ${gradient} ${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ─── Individual Card Components ──────────────────────────── */

function RevenueCard({
  revenue,
  monthlyData,
  year,
}: {
  revenue: number;
  monthlyData: number[];
  year: number;
}) {
  const { t } = useTranslation();
  return (
    <GlassCard gradient="v2-grad-emerald" className="col-span-2 row-span-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="v2-card-label">{t("dashboard.totalRevenue")}</p>
          <p className="text-xs text-white/50">{year}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-white/50" />
      </div>
      <p className="v2-led-value mt-4">{ledNumber(revenue)}</p>
      <span className="v2-card-unit">EUR</span>
      <div className="mt-auto pt-4">
        <MiniBarChart data={monthlyData} color="rgba(255,255,255,0.5)" width={200} height={40} />
      </div>
    </GlassCard>
  );
}

function InvoicesSentCard({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <GlassCard gradient="v2-grad-blue">
      <div className="flex items-start justify-between">
        <p className="v2-card-label">{t("dashboard.invoicesSent")}</p>
        <Send className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-auto">{count}</p>
      <DotMatrix filled={Math.min(count, 24)} total={24} color="rgba(147,197,253,0.8)" cols={8} />
    </GlassCard>
  );
}

function PendingCard({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <GlassCard gradient="v2-grad-amber">
      <div className="flex items-start justify-between">
        <p className="v2-card-label">{t("dashboard.pendingInvoices")}</p>
        <Clock className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-auto">{count}</p>
      <span className="v2-card-unit">in attesa</span>
    </GlassCard>
  );
}

function TaxCard({
  rate,
  taxDue,
  isStartup,
}: {
  rate: number;
  taxDue: number;
  isStartup: boolean;
}) {
  const { t } = useTranslation();
  return (
    <GlassCard gradient="v2-grad-orange">
      <div className="flex items-start justify-between">
        <div>
          <p className="v2-card-label">{t("dashboard.impostaSostitutiva")}</p>
          <p className="text-xs text-white/50">
            {isStartup ? t("dashboard.startup") : t("dashboard.ordinary")} {rate}%
          </p>
        </div>
        <Calculator className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-auto">{ledNumber(taxDue)}</p>
      <span className="v2-card-unit">EUR</span>
    </GlassCard>
  );
}

function InpsCard({
  total,
  gestione,
  base,
}: {
  total: number;
  gestione: string;
  base: number;
}) {
  const { t } = useTranslation();
  return (
    <GlassCard gradient="v2-grad-teal">
      <div className="flex items-start justify-between">
        <div>
          <p className="v2-card-label">{t("dashboard.inpsContributions")}</p>
          <p className="text-xs text-white/50 capitalize">{gestione}</p>
        </div>
        <PiggyBank className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-auto">{ledNumber(total)}</p>
      <span className="v2-card-unit">EUR</span>
      <div className="mt-2">
        <ArcGauge value={total} max={base} color="rgba(94,234,212,0.8)" size={64} />
      </div>
    </GlassCard>
  );
}

function NetIncomeCard({
  netIncome,
  totalRevenue,
}: {
  netIncome: number;
  totalRevenue: number;
}) {
  const { t } = useTranslation();
  const pct = totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 100) : 0;
  return (
    <GlassCard gradient="v2-grad-purple">
      <div className="flex items-start justify-between">
        <p className="v2-card-label">{t("dashboard.netIncome")}</p>
        <Wallet className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-auto">{ledNumber(netIncome)}</p>
      <span className="v2-card-unit">EUR</span>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-white/60">{pct}%</span>
        <div className="h-1.5 flex-1 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/50"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
}

function F24Card({
  primoAcconto,
  secondoAcconto,
  saldo,
}: {
  primoAcconto: number;
  secondoAcconto: number;
  saldo: number;
}) {
  const { t } = useTranslation();
  const total = primoAcconto + secondoAcconto + saldo;
  const data = [primoAcconto, secondoAcconto, saldo];
  return (
    <GlassCard gradient="v2-grad-rose" className="col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="v2-card-label">{t("dashboard.f24Schedule")}</p>
          <p className="text-xs text-white/50">{new Date().getFullYear()}</p>
        </div>
        <CalendarClock className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-2">{ledNumber(total)}</p>
      <span className="v2-card-unit">EUR totale</span>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/60">
        <div>
          <p className="text-white/40">1° Acc.</p>
          <p className="font-mono text-white/80">{formatEur(primoAcconto)}</p>
        </div>
        <div>
          <p className="text-white/40">2° Acc.</p>
          <p className="font-mono text-white/80">{formatEur(secondoAcconto)}</p>
        </div>
        <div>
          <p className="text-white/40">Saldo</p>
          <p className="font-mono text-white/80">{formatEur(saldo)}</p>
        </div>
      </div>
      <div className="mt-2">
        <MiniBarChart data={data} color="rgba(251,113,133,0.7)" width={180} height={24} />
      </div>
    </GlassCard>
  );
}

function MonthlyRevenueCard({ monthlyData }: { monthlyData: Array<{ month: number; revenue: number }> }) {
  const { t } = useTranslation();
  const months = t("dashboard.months", { returnObjects: true }) as string[];
  const currentMonth = new Date().getMonth(); // 0-indexed
  const currentRevenue = monthlyData.find((m) => m.month === currentMonth + 1)?.revenue ?? 0;
  const data = monthlyData.map((m) => m.revenue);
  return (
    <GlassCard gradient="v2-grad-sage">
      <div className="flex items-start justify-between">
        <div>
          <p className="v2-card-label">{t("dashboard.monthlyRevenue")}</p>
          <p className="text-xs text-white/50">{months[currentMonth]}</p>
        </div>
        <TrendingUp className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-auto">{ledNumber(currentRevenue)}</p>
      <span className="v2-card-unit">EUR</span>
      <div className="mt-2">
        <MiniLineChart data={data} color="rgba(190,242,100,0.8)" width={100} height={36} />
      </div>
    </GlassCard>
  );
}

function RevenueCapCard({ revenue }: { revenue: number }) {
  const cap = 85000;
  const pct = Math.min(Math.round((revenue / cap) * 100), 100);
  return (
    <GlassCard gradient="v2-grad-cyan">
      <div className="flex items-start justify-between">
        <div>
          <p className="v2-card-label">Limite Forfettario</p>
          <p className="text-xs text-white/50">{formatEurFull(cap)}</p>
        </div>
        <Euro className="h-4 w-4 text-white/40" />
      </div>
      <p className="v2-led-value mt-auto">{pct}<span className="text-lg">%</span></p>
      <div className="mt-2">
        <ArcGauge value={revenue} max={cap} color="rgba(103,232,249,0.8)" size={72} />
      </div>
    </GlassCard>
  );
}

/* ─── Skeleton Grid ───────────────────────────────────────── */

function DashboardV2Skeleton() {
  return (
    <div className="v2-card-grid">
      <Skeleton className="col-span-2 row-span-2 h-[280px] rounded-2xl bg-white/5" />
      <Skeleton className="h-[160px] rounded-2xl bg-white/5" />
      <Skeleton className="h-[160px] rounded-2xl bg-white/5" />
      <Skeleton className="h-[160px] rounded-2xl bg-white/5" />
      <Skeleton className="h-[160px] rounded-2xl bg-white/5" />
      <Skeleton className="h-[160px] rounded-2xl bg-white/5" />
      <Skeleton className="col-span-2 h-[180px] rounded-2xl bg-white/5" />
      <Skeleton className="h-[160px] rounded-2xl bg-white/5" />
      <Skeleton className="h-[160px] rounded-2xl bg-white/5" />
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */

export function DashboardV2() {
  const { t } = useTranslation();
  const navigate = useAppNavigate();
  const currentYear = new Date().getFullYear();
  const [anno, setAnno] = useState(currentYear);

  const { data, isLoading } = useDashboardSummary(anno);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const monthlyRevenues = useMemo(
    () => data?.monthlyRevenue.map((m) => m.revenue) ?? [],
    [data?.monthlyRevenue],
  );

  const netIncome = useMemo(() => {
    if (!data?.tax || !data?.inps) return 0;
    return data.totalRevenue - data.inps.totaleDovuto - data.tax.impostaDovuta;
  }, [data]);

  return (
    <div className="v2-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">v2 — Card View</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("dashboard.year")}:</span>
          <select
            className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm transition-colors duration-150"
            value={anno}
            onChange={(e) => setAnno(parseInt(e.target.value, 10))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Profile warning */}
      {data?.profileIncomplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm flex items-start gap-3 mb-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/40">
            <Calculator className="h-4 w-4 text-amber-700" />
          </div>
          <div>
            <p className="text-amber-900">{t("dashboard.profileWarning")}</p>
            <button
              className="mt-1 text-sm font-medium text-amber-800 underline hover:text-amber-900 cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              {t("dashboard.goToSettings")}
            </button>
          </div>
        </div>
      )}

      {/* Card Grid */}
      {isLoading ? (
        <DashboardV2Skeleton />
      ) : (
        <div className="v2-card-grid">
          {/* Row 1: Hero Revenue (2x2) + Invoices Sent + Pending */}
          <RevenueCard
            revenue={data?.totalRevenue ?? 0}
            monthlyData={monthlyRevenues}
            year={anno}
          />
          <InvoicesSentCard count={data?.invoicesSent ?? 0} />
          <PendingCard count={data?.pendingInvoices ?? 0} />

          {/* Row 2 (shares hero space): Tax + INPS */}
          {data?.tax && (
            <TaxCard
              rate={data.tax.aliquota}
              taxDue={data.tax.impostaDovuta}
              isStartup={data.tax.isStartup}
            />
          )}
          {data?.inps && (
            <InpsCard
              total={data.inps.totaleDovuto}
              gestione={data.inps.gestione}
              base={data.inps.baseImponibile}
            />
          )}

          {/* Row 3: F24 (2-wide) + Net Income + Revenue Cap */}
          {data?.f24 && (
            <F24Card
              primoAcconto={data.f24.primoAcconto}
              secondoAcconto={data.f24.secondoAcconto}
              saldo={data.f24.saldo}
            />
          )}
          {data?.tax && data?.inps && (
            <NetIncomeCard
              netIncome={netIncome}
              totalRevenue={data.totalRevenue}
            />
          )}
          <RevenueCapCard revenue={data?.totalRevenue ?? 0} />

          {/* Row 4: Monthly Revenue + Recent Invoices mini-card */}
          {data?.monthlyRevenue && data.monthlyRevenue.length > 0 && (
            <MonthlyRevenueCard monthlyData={data.monthlyRevenue} />
          )}
          {data && data.recentInvoices.length > 0 && (
            <GlassCard
              gradient="v2-grad-slate"
              className="col-span-2"
              onClick={() => navigate("/invoices")}
            >
              <div className="flex items-start justify-between">
                <p className="v2-card-label">{t("dashboard.recentInvoices")}</p>
                <Receipt className="h-4 w-4 text-white/40" />
              </div>
              <div className="mt-3 space-y-2">
                {data.recentInvoices.slice(0, 4).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-white/60 truncate max-w-[140px]">
                      #{inv.numeroFattura} — {inv.clientName}
                    </span>
                    <span className="font-mono text-white/80">
                      {formatEurFull(inv.totaleDocumento)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/40 flex items-center gap-1">
                {t("dashboard.recentInvoices")} <ChevronRight className="h-3 w-3" />
              </p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
