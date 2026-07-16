"use client";

import { useState, useEffect } from "react";
import { LuX, LuLoader } from "react-icons/lu";
import api from "@/app/utils/axios";

/* --- Types ----------------------------------------------------------- */
export interface GoalRow {
  id: string;
  platform: string;
  promise: number | null;
  perfCeiling: number | null;
  perfDelta: number | null;
  deltaLoss: number | null;
  netPromise: number | null;
  resources: string;
}

export interface ApiUserGoal {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  promise: number;
  perf_ceiling: number;
  perf_delta: number;
  delta_loss: number;
  net_promise: number;
}

export interface ApiPlanTotals {
  promise: number;
  perf_ceiling: number;
  perf_delta: number;
  delta_loss: number;
  net_promise: number;
}

interface UserGoal {
  userId?: number;
  username: string;
  promise: number | string;
  perfCeiling: number | string;
  perfDelta: number | string;
  deltaLoss: number | string;
  netPromise: number | string;
}

/* --- Helpers --------------------------------------------------------- */
function fmt(n: number | null): string {
  if (n === null || n === undefined) return "-";
  const neg = n < 0;
  const abs = Math.abs(n);
  const display = Number.isInteger(abs)
    ? abs.toLocaleString("en-US")
    : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const str = `$${display}`;
  return neg ? `-${str}` : str;
}

const NUM_FIELDS: (keyof Omit<UserGoal, "username" | "userId">)[] = [
  "promise",
  "perfCeiling",
  "perfDelta",
  "deltaLoss",
  "netPromise",
];

const FIELD_LABELS: Record<string, string> = {
  promise: "Promise",
  perfCeiling: "Perf. Ceiling",
  perfDelta: "Perf. Delta",
  deltaLoss: "Delta Loss",
  netPromise: "Net Promise",
};

/* --- Main Component -------------------------------------------------- */
export default function GoalAssignModal({
  open,
  onClose,
  onSave,
  row,
  loading = false,
  initialGoals,
  planTotals,
  planId,
  workspaceId,
  token,
}: {
  open: boolean;
  onClose: () => void;
  onSave?: (rowId: string) => void;
  row: GoalRow | null;
  loading?: boolean;
  initialGoals?: ApiUserGoal[];
  planTotals?: ApiPlanTotals;
  planId?: number;
  workspaceId?: number | string;
  token?: string | null;
}) {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!row) return;

    // If API data is available, use it — but if every value is 0 (first time),
    // fall through to equal distribution so users get a sensible starting point.
    if (initialGoals && initialGoals.length > 0) {
      const allZero = initialGoals.every(
        (g) => g.promise === 0 && g.perf_ceiling === 0 && g.perf_delta === 0 &&
               g.delta_loss === 0 && g.net_promise === 0
      );

      if (!allZero) {
        setGoals(
          initialGoals.map((g) => ({
            userId:      g.user_id,
            username:    g.user_name,
            promise:     g.promise,
            perfCeiling: g.perf_ceiling,
            perfDelta:   g.perf_delta,
            deltaLoss:   g.delta_loss,
            netPromise:  g.net_promise,
          }))
        );
        return;
      }

      // All zeros → use names from API but distribute totals equally (below)
    }

    // Derive usernames: prefer API names (all-zero case) over comma-separated string
    const users = (initialGoals && initialGoals.length > 0)
      ? initialGoals.map((g) => g.user_name)
      : row.resources.split(",").map((s) => s.trim()).filter(Boolean);
    const count = users.length;

    const totals = planTotals
      ? {
          promise:     planTotals.promise,
          perfCeiling: planTotals.perf_ceiling,
          perfDelta:   planTotals.perf_delta,
          deltaLoss:   planTotals.delta_loss,
          netPromise:  planTotals.net_promise,
        }
      : {
          promise:     row.promise     ?? 0,
          perfCeiling: row.perfCeiling ?? 0,
          perfDelta:   row.perfDelta   ?? 0,
          deltaLoss:   row.deltaLoss   ?? 0,
          netPromise:  row.netPromise  ?? 0,
        };

    setGoals(
      users.map((username, idx) => {
        const userId = initialGoals?.[idx]?.user_id;
        const calcField = (total: number): number => {
          if (!total || count === 0) return 0;
          const base = Math.floor((total / count) * 100) / 100;
          if (idx === 0) {
            const rest = Math.round((total - base * count) * 100) / 100;
            return Math.round((base + rest) * 100) / 100;
          }
          return base;
        };
        return {
          userId,
          username,
          promise:     calcField(totals.promise),
          perfCeiling: calcField(totals.perfCeiling),
          perfDelta:   calcField(totals.perfDelta),
          deltaLoss:   calcField(totals.deltaLoss),
          netPromise:  calcField(totals.netPromise),
        };
      })
    );
    setSaveError(null);
  }, [row, open, initialGoals, planTotals]);

  if (!open || !row) return null;

  // Effective row totals for validation and display
  const effectiveTotals = planTotals
    ? {
        promise:     planTotals.promise,
        perfCeiling: planTotals.perf_ceiling,
        perfDelta:   planTotals.perf_delta,
        deltaLoss:   planTotals.delta_loss,
        netPromise:  planTotals.net_promise,
      }
    : {
        promise:     row.promise     ?? 0,
        perfCeiling: row.perfCeiling ?? 0,
        perfDelta:   row.perfDelta   ?? 0,
        deltaLoss:   row.deltaLoss   ?? 0,
        netPromise:  row.netPromise  ?? 0,
      };

  const handleChange = (
    idx: number,
    field: keyof Omit<UserGoal, "username" | "userId">,
    raw: string
  ) => {
    setGoals(goals.map((g, i) => i === idx ? { ...g, [field]: raw } : g));
  };

  const columnTotal = (field: keyof Omit<UserGoal, "username" | "userId">) =>
    Math.round(goals.reduce((s, g) => {
      const val = g[field];
      const num = typeof val === "string" ? parseFloat(val) : val;
      return s + (isNaN(num as number) ? 0 : (num ?? 0));
    }, 0) * 100) / 100;

  // Computed live — never stale
  const colErrors: Partial<Record<keyof Omit<UserGoal, "username" | "userId">, string>> = {};
  for (const f of NUM_FIELDS) {
    const total = columnTotal(f);
    const max = effectiveTotals[f] ?? 0;
    if (total > max)  colErrors[f] = `Total exceeds ${fmt(max)}`;
    else if (total < max) colErrors[f] = `Total under ${fmt(max)}`;
  }
  const hasErrors = Object.keys(colErrors).length > 0;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[90] -translate-x-1/2 -translate-y-1/2 w-[820px] max-w-[95vw] max-h-[90vh] flex flex-col rounded-2xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6EBF1] dark:border-[#1F2A37] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#111928] dark:text-white">Assign Goals</h2>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              Platform: <span className="font-semibold text-[#5750F1]">{row.platform}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuX size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 py-16">
            <LuLoader size={18} className="animate-spin text-[#5750F1]" />
            <span className="text-xs text-[#9CA3AF]">Loading goal data...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-auto px-6 py-4">
            {/* Row Totals */}
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Row Totals (read-only)</p>
            <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] overflow-hidden mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-[#0a1018] border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                    {NUM_FIELDS.map((f) => (
                      <th key={f} className="px-4 py-2 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                        {FIELD_LABELS[f]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {NUM_FIELDS.map((f) => (
                      <td key={f} className="px-4 py-2.5">
                        <span className="text-xs font-semibold text-[#111928] dark:text-[#D1D5DB]">
                          {fmt(effectiveTotals[f])}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Per-user allocation */}
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Goal Allocation per User</p>
            {goals.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] italic">No team members assigned. Add resources first.</p>
            ) : (
              <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] dark:bg-[#0a1018] border-b border-[#E6EBF1] dark:border-[#1F2A37]">
                      <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide w-32">Username</th>
                      {NUM_FIELDS.map((f) => (
                        <th key={f} className="px-4 py-2 text-left text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{FIELD_LABELS[f]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((g, idx) => (
                      <tr key={g.username} className="border-b border-[#E6EBF1] dark:border-[#1F2A37] hover:bg-[#F9FAFB] dark:hover:bg-[#0a1018] transition-colors">
                        <td className="px-4 py-2">
                          <span className="text-xs font-semibold text-[#111928] dark:text-white">{g.username}</span>
                        </td>
                        {NUM_FIELDS.map((f) => {
                          const hasErr = !!colErrors[f];
                          return (
                            <td key={f} className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={g[f] ?? ""}
                                onChange={(e) => handleChange(idx, f, e.target.value)}
                                className={`w-24 rounded-lg border px-2 py-1 text-xs text-[#111928] dark:text-white bg-[#F9FAFB] dark:bg-[#0a1018] outline-none transition-colors ${hasErr ? "border-red-400 focus:border-red-400" : "border-[#E6EBF1] dark:border-[#374151] focus:border-[#5750F1]"}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Column totals row */}
                    <tr className="bg-[#F3F4F6] dark:bg-[#0a0f1a] border-t-2 border-[#E6EBF1] dark:border-[#374151]">
                      <td className="px-4 py-2 text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF]">Total</td>
                      {NUM_FIELDS.map((f) => {
                        const total = Math.round(columnTotal(f) * 100) / 100;
                        const max = effectiveTotals[f] ?? 0;
                        const over  = total > max;
                        const under = total < max;
                        return (
                          <td key={f} className="px-4 py-2">
                            <span className={`text-xs font-semibold ${
                              over  ? "text-red-500 dark:text-red-400" :
                              under ? "text-amber-500 dark:text-amber-400" :
                              "text-[#111928] dark:text-[#D1D5DB]"
                            }`}>
                              {fmt(total)}
                              {over  && <span className="ml-1 text-[9px]">({fmt(max)} max)</span>}
                              {under && <span className="ml-1 text-[9px]">(under {fmt(max)})</span>}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37] shrink-0 bg-white dark:bg-[#0d1520]">
          {saveError && <span className="text-[11px] text-red-400 mr-auto">{saveError}</span>}
          <button onClick={onClose} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">Cancel</button>
          <button
            onClick={async () => {
              if (hasErrors || !row || !planId) return;
              const goalsWithIds = goals.filter(g => g.userId !== undefined);
              if (goalsWithIds.length === 0) {
                // fallback: just call onSave if no user_ids available
                onSave?.(row.id);
                onClose();
                return;
              }
              setSaving(true);
              setSaveError(null);
              try {
                await api.post(`/api/v1/planner/plans/${planId}/user-goals`, {
                  workspace_id: Number(workspaceId ?? 1),
                  goals: goalsWithIds.map(g => ({
                    user_id:     g.userId!,
                    promise:     Number(g.promise) || 0,
                    perf_ceiling: Number(g.perfCeiling) || 0,
                    perf_delta:  Number(g.perfDelta) || 0,
                    delta_loss:  Number(g.deltaLoss) || 0,
                    net_promise: Number(g.netPromise) || 0,
                  })),
                }, { headers: { Authorization: `Bearer ${token}` } });
                onSave?.(row.id);
                onClose();
              } catch (err: any) {
                setSaveError(err?.response?.data?.message || "Failed to save goals");
              } finally {
                setSaving(false);
              }
            }}
            disabled={hasErrors || loading || saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#5750F1] px-5 py-2 text-xs font-bold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <><LuLoader size={12} className="animate-spin" /> Saving...</> : "Save Goals"}
          </button>
        </div>
      </div>
    </>
  );
}
