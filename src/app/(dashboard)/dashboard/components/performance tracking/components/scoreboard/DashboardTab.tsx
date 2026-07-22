"use client";

import { useState, useEffect, useCallback } from "react";
import { LuTrendingDown, LuTrendingUp, LuLoader } from "react-icons/lu";
import FilterBar from "./FilterBar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend,
  ResponsiveContainer, Cell,
} from "recharts";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* --- Types --------------------------------------------------------------- */
interface Summary {
  total_spend:    number;
  total_revenue:  number;
  roi_pct:        number;
  gross_margin:   number;
}
interface VerticalRow {
  vertical_id:   number;
  vertical_name: string;
  spend:         number;
  revenue:       number;
  roi_pct:       number;
  margin:        number;
  share_pct:     number;
}
interface DailyPoint {
  date:    string;
  spend:   number;
  revenue: number;
  roi_pct: number;
}

/* --- Business Contribution ----------------------------------------------- */

/** Custom tooltip shown on bar hover — shows all 4 vertical KPIs */
function VerticalTooltip({ active, payload, verticals }: {
  active?:   boolean;
  payload?:  { payload: { name: string; value: number } }[];
  verticals: VerticalRow[];
}) {
  if (!active || !payload?.length) return null;
  const name = payload[0]?.payload?.name;
  const row  = verticals.find(v => v.vertical_name === name);
  if (!row) return null;

  const rows = [
    { label: "Spend",   value: `$${Math.round(row.spend).toLocaleString()}`,   color: "#6B7280" },
    { label: "Revenue", value: `$${Math.round(row.revenue).toLocaleString()}`, color: "#22c55e" },
    { label: "ROI",     value: `${row.roi_pct.toFixed(1)}%`,                   color: row.roi_pct >= 0 ? "#2563eb" : "#ef4444" },
    { label: "Margin",  value: `$${Math.round(row.margin).toLocaleString()}`,  color: row.margin >= 0 ? "#2563eb" : "#ef4444" },
  ];

  return (
    <div
      style={{
        background: "var(--tooltip-bg, #fff)",
        border: "1px solid var(--tooltip-border, #E6EBF1)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        minWidth: 160,
      }}
      className="bg-white dark:bg-[#122031] border-[#E6EBF1] dark:border-[#1F2A37]"
    >
      <p className="text-[11px] font-bold text-[#111928] dark:text-white mb-2 pb-1.5 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        {name}
      </p>
      <div className="flex flex-col gap-1.5">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between gap-6">
            <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">{r.label}</span>
            <span className="text-[11px] font-semibold" style={{ color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessContribution({ verticals, loading }: { verticals: VerticalRow[]; loading: boolean }) {
  const barData = verticals.map(v => ({ name: v.vertical_name, value: v.margin }));

  // Auto-scale domain to nearest nice round number above max absolute value
  const maxAbs = barData.length > 0 ? Math.max(...barData.map(d => Math.abs(d.value)), 1) : 1;
  const step   = Math.pow(10, Math.floor(Math.log10(maxAbs)));
  const domainMax = Math.ceil(maxAbs / step) * step;
  const domainMin = barData.some(d => d.value < 0) ? -Math.round(domainMax * 0.35) : 0;

  const barHeight = Math.max(80, barData.length * 44);

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
      <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-4">Business Contribution</p>
      {loading || barData.length === 0 ? (
        <div className="flex items-center justify-center gap-2" style={{ height: 80 }}>
          {loading
            ? <><LuLoader size={16} className="animate-spin text-[#5750F1]" /><span className="text-xs text-[#9CA3AF]">Loading…</span></>
            : <span className="text-xs text-[#9CA3AF]">No data available</span>
          }
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2A37" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickFormatter={(v) => v >= 1000 || v <= -1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
              domain={[domainMin, domainMax]}
            />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} width={80} />
            <Tooltip
              content={<VerticalTooltip verticals={verticals} />}
              cursor={{ fill: "rgba(87,80,241,0.07)" }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={26}>
              {barData.map((entry, i) => <Cell key={i} fill={entry.value >= 0 ? "#2563eb" : "#ef4444"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* --- Formatters ---------------------------------------------------------- */
function fmtMoney(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${Math.round(n)}`;
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

/* --- KPI Cards ----------------------------------------------------------- */
const KPI_ICONS = ["📅", "$", "~", "◎"];

function KPICards({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const items = [
    { label: "Total Spend",   value: summary ? fmtMoney(summary.total_spend)   : "—", accent: false },
    { label: "Total Revenue", value: summary ? fmtMoney(summary.total_revenue) : "—", accent: false },
    { label: "ROI",           value: summary ? fmtPct(summary.roi_pct)         : "—", accent: true  },
    { label: "Gross Margin",  value: summary ? fmtMoney(summary.gross_margin)  : "—", accent: true  },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((kpi, idx) => (
        <div key={kpi.label} className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">{kpi.label}</span>
            <span className="text-[#9CA3AF] text-xs">{KPI_ICONS[idx]}</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 mt-2">
              <LuLoader size={16} className="animate-spin text-[#5750F1]" />
              <span className="text-xs text-[#9CA3AF]">Loading…</span>
            </div>
          ) : (
            <p className={`text-2xl font-bold mb-1 ${kpi.accent ? "text-[#2563eb]" : "text-[#111928] dark:text-white"}`}>
              {kpi.value}
            </p>
          )}
          {/* No vs-last-month comparison from this API; omit that row */}
        </div>
      ))}
    </div>
  );
}

/* --- Verticals Table ----------------------------------------------------- */
function VerticalsTable({ verticals, loading }: { verticals: VerticalRow[]; loading: boolean }) {
  // Compute totals
  const totals = verticals.reduce(
    (acc, v) => ({ spend: acc.spend + v.spend, revenue: acc.revenue + v.revenue, margin: acc.margin + v.margin }),
    { spend: 0, revenue: 0, margin: 0 }
  );
  const totalRoi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
        <span className="text-xs font-semibold text-[#111928] dark:text-white">Verticals</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <LuLoader size={16} className="animate-spin text-[#5750F1]" />
          <span className="text-xs text-[#9CA3AF]">Loading…</span>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E6EBF1] dark:border-[#1F2A37]">
              {["Vertical","Spend","Revenue","ROI","Margin","Share"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-[#6B7280] dark:text-[#9CA3AF] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {verticals.map((row) => {
              const neg = row.roi_pct < 0;
              return (
                <tr key={row.vertical_id} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] last:border-0 hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">
                  <td className="px-3 py-2 text-[#111928] dark:text-[#D1D5DB]">{row.vertical_name}</td>
                  <td className="px-3 py-2 text-[#6B7280] dark:text-[#9CA3AF]">{fmtMoney(row.spend)}</td>
                  <td className="px-3 py-2 text-[#6B7280] dark:text-[#9CA3AF]">{fmtMoney(row.revenue)}</td>
                  <td className={`px-3 py-2 font-semibold ${neg ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>{fmtPct(row.roi_pct)}</td>
                  <td className={`px-3 py-2 ${neg ? "text-red-500 dark:text-red-400" : "text-[#6B7280] dark:text-[#9CA3AF]"}`}>{fmtMoney(row.margin)}</td>
                  <td className="px-3 py-2 text-[#6B7280] dark:text-[#9CA3AF]">{fmtPct(row.share_pct)}</td>
                </tr>
              );
            })}
            {/* Totals row */}
            {verticals.length > 0 && (
              <tr className="bg-[#F9FAFB] dark:bg-[#122031] border-t border-[#E6EBF1] dark:border-[#1F2A37]">
                <td className="px-3 py-2 font-bold text-[#111928] dark:text-white">Total</td>
                <td className="px-3 py-2 font-bold text-[#111928] dark:text-white">{fmtMoney(totals.spend)}</td>
                <td className="px-3 py-2 font-bold text-[#111928] dark:text-white">{fmtMoney(totals.revenue)}</td>
                <td className={`px-3 py-2 font-bold ${totalRoi < 0 ? "text-red-500 dark:text-red-400" : "text-[#2563eb]"}`}>{fmtPct(totalRoi)}</td>
                <td className="px-3 py-2 font-bold text-[#111928] dark:text-white">{fmtMoney(totals.margin)}</td>
                <td className="px-3 py-2 font-bold text-[#111928] dark:text-white">100.0%</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* --- Daily Trend Chart --------------------------------------------------- */
function DailyTrend({ data, loading }: { data: DailyPoint[]; loading: boolean }) {
  const chartData = data.map(d => ({
    day: d.date.slice(5), // "07-01"
    spend:   d.spend,
    revenue: d.revenue,
    roi:     d.roi_pct,
  }));

  return (
    <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
      <p className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-4">Daily Performance Trend</p>
      {loading ? (
        <div className="flex items-center justify-center h-[220px] gap-2">
          <LuLoader size={18} className="animate-spin text-[#5750F1]" />
          <span className="text-xs text-[#9CA3AF]">Loading…</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ left: 0, right: 30, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2A37" />
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#6B7280" }} interval={3} />
            <YAxis yAxisId="left"  tick={{ fontSize: 9, fill: "#6B7280" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#6B7280" }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "#0d1520", border: "1px solid #1F2A37", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#9CA3AF" }}
              formatter={((value: unknown, name: string) => {
                const v = typeof value === "number" ? value : 0;
                if (name === "ROI %") return [`${v.toFixed(1)}%`, name];
                return [`$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, name];
              }) as any}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
            <Line yAxisId="left"  type="monotone" dataKey="spend"   stroke="#2563eb" strokeWidth={2} dot={false} name="Spend" />
            <Line yAxisId="left"  type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue" strokeDasharray="4 2" />
            <Line yAxisId="right" type="monotone" dataKey="roi"     stroke="#f0ffd4" strokeWidth={1.5} dot={false} name="ROI %" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* --- Dashboard Tab ------------------------------------------------------- */
export default function DashboardTab() {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

  // "committed" state — only updates when user clicks Done in the picker
  const today = new Date();
  const [committedYear,   setCommittedYear]   = useState(today.getFullYear());
  const [committedMonths, setCommittedMonths] = useState<Set<number>>(new Set([today.getMonth()]));

  // API data
  const [summary,    setSummary]    = useState<Summary | null>(null);
  const [verticals,  setVerticals]  = useState<VerticalRow[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyPoint[]>([]);
  const [loading,    setLoading]    = useState(false);

  const fetchScoreboard = useCallback(async (year = committedYear, months = committedMonths) => {
    if (months.size === 0) return;
    const sorted     = [...months].sort((a, b) => a - b);
    const pad        = (n: number) => String(n + 1).padStart(2, "0");
    const startMonth = `${year}-${pad(sorted[0])}`;
    const endMonth   = `${year}-${pad(sorted[sorted.length - 1])}`;

    setLoading(true);
    try {
      const res = await api.get("/api/v1/planner/scoreboard", {
        params: { workspace_id: workspaceId, start_month: startMonth, end_month: endMonth },
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data?.data;
      if (d) {
        setSummary(d.summary ?? null);
        setVerticals(d.verticals ?? []);
        setDailyTrend(d.daily_trend ?? []);
        toast.success(res.data?.message ?? "Scoreboard loaded successfully");
      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.message ?? "Failed to fetch scoreboard";
      console.error("Failed to fetch scoreboard:", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, token]);

  // Fetch once on mount with the default committed state
  useEffect(() => { fetchScoreboard(committedYear, committedMonths); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        onCommit={(year, months) => {
          setCommittedYear(year);
          setCommittedMonths(months);
          fetchScoreboard(year, months);
        }}
        onRefresh={() => fetchScoreboard(committedYear, committedMonths)}
        isRefreshing={loading}
        defaultYear={committedYear}
        defaultMonths={committedMonths}
      />
      <KPICards summary={summary} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BusinessContribution verticals={verticals} loading={loading} />
        <VerticalsTable verticals={verticals} loading={loading} />
      </div>
      <DailyTrend data={dailyTrend} loading={loading} />
    </div>
  );
}
