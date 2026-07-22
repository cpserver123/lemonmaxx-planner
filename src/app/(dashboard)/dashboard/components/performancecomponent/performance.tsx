"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { LuCalendar, LuChevronLeft, LuChevronRight, LuChevronDown, LuStar, LuClipboardCheck, LuZap, LuRefreshCw, LuSearch } from "react-icons/lu";
import MyTeamPanel from "../my-team/MyTeamPanel";
import { useAuth } from "@/context/AuthContext";
import CheckIn from "../dashboardcomponent/components/checkin";
import ActionDrawer, { type DrawerRow } from "../ActionDrawer";
import { toast } from "react-toastify";




/* --- KPI Stat cards -------------------------------------------------- */
const STATS: { label: string; value: string; sub: string | null; color: string; resolvable?: boolean }[] = [
  { label: "Members",       value: "9",    sub: null,                       color: "text-[#111928] dark:text-white" },
  { label: "Promises",      value: "36",   sub: "36 on - 0 risk - 0 break", color: "text-[#2563eb]" },
  { label: "Breakdowns",    value: "20",   sub: "19 over 7d",               color: "text-orange-400",                resolvable: true },
  { label: "Escalations",   value: "0",    sub: null,                       color: "text-[#111928] dark:text-white", resolvable: true },
  { label: "Requests",      value: "0",    sub: null,                       color: "text-[#111928] dark:text-white", resolvable: true },
  { label: "Due today",     value: "2",    sub: null,                       color: "text-[#111928] dark:text-white" },
  { label: "Overdue",       value: "6",    sub: null,                       color: "text-orange-400" },
  { label: "Check-in",      value: "0%",   sub: null,                       color: "text-orange-400" },
  { label: "Performance",   value: "74%",  sub: "MTD avg",                  color: "text-[#2563eb]" },
];


const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* --- FilterBar ------------------------------------------------------- */
function buildLabel(months: Set<number>, year: number): string {
  if (months.size === 0) return `— ${year}`;
  const sorted = [...months].sort((a, b) => a - b);
  if (sorted.length === 1) return `${MONTHS[sorted[0]]} ${year}`;
  const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isConsecutive) return `${MONTHS[sorted[0]]} – ${MONTHS[sorted[sorted.length - 1]]} ${year}`;
  if (sorted.length <= 3) return sorted.map(i => MONTHS[i]).join(", ") + ` ${year}`;
  return `${sorted.length} months ${year}`;
}

function FilterBar({
  onCheckIn,
  hideAdminItems,
  selectedUser,
  setSelectedUser,
  users,
  selectedYear,
  selectedMonth,
  onMonthYearChange,
  onRefresh,
  isRefreshing,
  hideUserDropdown,
}: {
  onCheckIn: () => void;
  hideAdminItems: boolean;
  selectedUser: string;
  setSelectedUser: (v: string) => void;
  users: { id: number; name: string; role: string }[];
  selectedYear: number;
  selectedMonth: number;
  onMonthYearChange: (month: number, year: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  hideUserDropdown: boolean;
}) {
  const now = new Date();
  const [activeTime, setActiveTime] = useState(2); // MTD
  const [showPicker, setShowPicker] = useState(false);
  const [showUserDrop, setShowUserDrop] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const userDropRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on click outside
  useEffect(() => {
    if (!showUserDrop) return;
    const handler = (e: MouseEvent) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) {
        setShowUserDrop(false);
        setUserSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserDrop]);

  // Use parent-controlled values as the source of truth for local draft
  const [localYear, setLocalYear] = useState<number>(selectedYear);
  const [localMonths, setLocalMonths] = useState<Set<number>>(new Set([selectedMonth]));

  // Sync local draft if parent changes (e.g. on mount)
  useEffect(() => {
    setLocalYear(selectedYear);
    setLocalMonths(new Set([selectedMonth]));
  }, [selectedYear, selectedMonth]);

  const label = buildLabel(new Set([selectedMonth]), selectedYear);

  const handleOpenPicker = () => {
    setLocalYear(selectedYear);
    setLocalMonths(new Set([selectedMonth]));
    setShowPicker(true);
  };

  const toggleLocalMonth = (i: number) => {
    // Single-select: clicking a month replaces the selection
    setLocalMonths(new Set([i]));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Refresh data"
        className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#5750F1]/40 hover:text-[#5750F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LuRefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
      </button>

      {/* Users dropdown — hidden for role=user */}
      {!hideUserDropdown && (
        <div ref={userDropRef} className="relative">
          <button
            onClick={() => { setShowUserDrop(p => !p); setUserSearch(""); }}
            className="flex items-center justify-between gap-1 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] pl-2.5 pr-7 py-1.5 text-[11px] font-medium text-[#111928] dark:text-white outline-none cursor-pointer hover:border-[#5750F1]/40 transition-colors w-40 text-left relative"
          >
            <span className="truncate">
              {users.find(u => String(u.id) === selectedUser)?.name || "All Users"}
            </span>
            <LuChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          </button>

          {showUserDrop && (
            <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl overflow-hidden">
              {/* Search box */}
              <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[#E6EBF1] dark:border-[#374151]">
                <LuSearch size={11} className="text-[#9CA3AF] shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search user..."
                  className="flex-1 bg-transparent text-[11px] text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              {/* List — fits 5 users nicely and is scrollable */}
              <div className="max-h-[160px] overflow-y-auto py-1">
                <button
                  onClick={() => { setSelectedUser(""); setShowUserDrop(false); setUserSearch(""); }}
                  className={`w-full text-left px-2.5 py-1.5 text-[11px] transition-colors ${
                    selectedUser === "" ? "bg-[#5750F1]/10 text-[#5750F1] font-semibold" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                  }`}
                >
                  All Users
                </button>
                {users
                  .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()))
                  .map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(String(u.id)); setShowUserDrop(false); setUserSearch(""); }}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] transition-colors ${
                        selectedUser === String(u.id) ? "bg-[#5750F1]/10 text-[#5750F1] font-semibold" : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}
                    >
                      {u.name} ({u.role})
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <span className="h-4 w-px bg-[#E6EBF1] dark:bg-[#374151]" />

      {/* Check In button — hidden for superadmin/admin viewing a specific individual */}
      {!hideAdminItems && (
        <button
          onClick={onCheckIn}
          className="flex items-center gap-1.5 rounded-lg border border-[#5750F1]/40 bg-[#5750F1]/5 px-3 py-1.5 text-[11px] font-semibold text-[#5750F1] dark:text-[#8b89f9] hover:bg-[#5750F1]/10 transition-colors cursor-pointer"
        >
          <LuClipboardCheck size={13} />
          Check In
        </button>
      )}

      {/* Multi-month picker */}
      <div className="ml-auto relative">
        <button
          onClick={handleOpenPicker}
          className="flex items-center gap-2 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors cursor-pointer"
        >
          <LuCalendar size={13} className="text-[#9CA3AF]" />
          <span>{label}</span>
          <LuChevronDown size={12} className={`text-[#9CA3AF] transition-transform duration-200 ${showPicker ? "rotate-180" : ""}`} />
        </button>

        {showPicker && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#27303E] bg-white dark:bg-[#122031] shadow-xl p-4">
              {/* Year row */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setLocalYear(y => y - 1)}
                  className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                >
                  <LuChevronLeft size={14} />
                </button>
                <span className="text-sm font-semibold text-[#111928] dark:text-white">{localYear}</span>
                <button
                  onClick={() => setLocalYear(y => y + 1)}
                  className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                >
                  <LuChevronRight size={14} />
                </button>
              </div>

              {/* Month grid — multi-select */}
              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, i) => {
                  const active = localMonths.has(i);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleLocalMonth(i)}
                      className={`relative rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-[#5750F1] text-white"
                          : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                      }`}
                    >
                      {m}
                      {active && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-white">
                          <svg width="6" height="5" viewBox="0 0 6 5" fill="none">
                            <path d="M1 2.5L2.5 4L5 1" stroke="#5750F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E6EBF1] dark:border-[#27303E]">
                <button
                  onClick={() => setLocalMonths(new Set())}
                  className="text-[10px] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    const chosenMonth = [...localMonths][0] ?? selectedMonth;
                    onMonthYearChange(chosenMonth, localYear);
                    setShowPicker(false);
                  }}
                  className="rounded-md bg-[#5750F1] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#4742d4] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* --- Review Score Card ----------------------------------------------- */
function ReviewScoreCard() {
  const score = 74;

  const scoreColor = score >= 70 ? "text-green-500" : score >= 40 ? "text-orange-400" : "text-red-500";
  const barColor   = score >= 70 ? "bg-green-500"   : score >= 40 ? "bg-orange-400"   : "bg-red-500";

  return (
    <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <LuStar size={11} className="text-[#9CA3AF] shrink-0" />
        <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Review Score</span>
      </div>
      <p className={`text-2xl font-bold mt-0.5 ${scoreColor}`}>
        {score}
        <span className="text-sm font-normal text-[#9CA3AF] ml-0.5">/100</span>
      </p>
      <div className="h-1.5 rounded-full bg-[#E6EBF1] dark:bg-[#1F2A37] overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

/* --- API response shape ---------------------------------------------- */
interface DayExecution { present: number; total: number; percentage: number; }
interface ActionItem {
  action_id: number;
  title: string;
  status: string;
  category: string;
  platform: string;
  age_days: number;
  pathway_id: number;
  pathway_name: string;
  due_date: string;
  created_at: string;
}
interface ActionsData {
  breakdowns:  ActionItem[];
  escalations: ActionItem[];
  requests:    ActionItem[];
  total:       number;
}
interface SummaryData {
  members:     { tl: number; user: number; total: number };
  promises:    number;
  breakdowns:  number;
  escalations: number;
  requests:    number;
  due_today:   number;
  overdue:     number;
  execution: {
    monday: DayExecution; tuesday: DayExecution; wednesday: DayExecution;
    thursday: DayExecution; friday: DayExecution; saturday: DayExecution;
    sunday: DayExecution; overall_percentage: number;
  };
  performance: number[];
}

/* --- Performance Dashboard ------------------------------------------- */
export default function PerformanceSection() {
  const now = new Date();
  const [showBreakdowns, setShowBreakdowns] = useState(false);
  const [showCheckIn,    setShowCheckIn]    = useState(false);
  const [selectedUser,   setSelectedUser]   = useState("");
  const [users,          setUsers]          = useState<{ id: number; name: string; role: string }[]>([]);
  const [drawerRow,      setDrawerRow]      = useState<DrawerRow | null>(null);
  const [pendingStrategyId, setPendingStrategyId] = useState<string | null>(null);
  const [selectedMonth,  setSelectedMonth]  = useState(() => now.getMonth());
  const [selectedYear,   setSelectedYear]   = useState(() => now.getFullYear());
  const [summaryData,    setSummaryData]    = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actionsData,    setActionsData]    = useState<ActionsData | null>(null);
  const [actionsLoading, setActionsLoading] = useState(false);
  const { user, token } = useAuth();
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const role = (user?.role ?? "").toLowerCase();
  const isAdminRole = role === "superadmin" || role === "admin";
  const hideAdminItems = isAdminRole && selectedUser !== "";


  // Fetch all users (no role filter) on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get(`/api/v1/user-management/workspaces/${workspaceId}/users`, {
          params: { only_active: false, full_data: true },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          const list = (res.data.data.users || []).map((u: any) => ({ id: u.id, name: u.name, role: u.role }));
          setUsers(list);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        const msg = (err as any)?.response?.data?.message ?? "Failed to load users";
        toast.error(msg);
      }
    };
    loadUsers();
  }, [workspaceId, token]);

  // Fetch dashboard summary whenever month/year/user filter changes
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params: Record<string, string | number> = {
        workspace_id: workspaceId,
        month: String(selectedMonth + 1).padStart(2, "0"),
        year:  selectedYear,
      };
      if (selectedUser) params.user_id = selectedUser;
      const res = await api.get("/api/v1/planner/dashboard/summary", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setSummaryData(res.data.data as SummaryData);
        toast.success(res.data.message ?? "Dashboard summary loaded successfully");
      }
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      const msg = (err as any)?.response?.data?.message ?? "Failed to load dashboard summary";
      toast.error(msg);
    } finally {
      setSummaryLoading(false);
    }
  }, [workspaceId, token, selectedMonth, selectedYear, selectedUser]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Fetch actions data (breakdowns / escalations / requests)
  const fetchActions = useCallback(async () => {
    setActionsLoading(true);
    try {
      const params: Record<string, string | number> = {
        workspace_id: workspaceId,
        month: String(selectedMonth + 1).padStart(2, "0"),
        year:  selectedYear,
      };
      if (selectedUser) params.user_id = selectedUser;
      const res = await api.get("/api/v1/planner/dashboard/actions", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        setActionsData(res.data.data as ActionsData);
        toast.success(res.data.message ?? "Actions loaded successfully");
      }
    } catch (err) {
      console.error("Failed to fetch actions:", err);
      const msg = (err as any)?.response?.data?.message ?? "Failed to load actions data";
      toast.error(msg);
    } finally {
      setActionsLoading(false);
    }
  }, [workspaceId, token, selectedMonth, selectedYear, selectedUser]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  const openEditDrawer = (action: ActionItem) => {
    setPendingStrategyId(String(action.pathway_id));
    setDrawerRow({
      id:              String(action.action_id),
      action:          action.title,
      intendedOutcome: "",
      status:          action.status.charAt(0).toUpperCase() + action.status.slice(1),
      due:             action.due_date,
      accountable:     "",
      linkTo:          action.pathway_name,
      category:        (action.category.charAt(0).toUpperCase() + action.category.slice(1)) as import("../ActionDrawer").Category,
      platform:        action.platform as import("../ActionDrawer").Platform,
    });
  };

  const handleRefresh = useCallback(() => {
    fetchSummary();
    fetchActions();
  }, [fetchSummary, fetchActions]);

  if (showCheckIn) {
    return <CheckIn onClose={() => setShowCheckIn(false)} />;
  }

  if (showBreakdowns) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F3F4F6] dark:bg-[#020d1a]">
        <MyTeamPanel initialTab="breakdown" onClose={() => setShowBreakdowns(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Section title + filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-[#111928] dark:text-white">Performance Dashboard</h2>
        <FilterBar
          onCheckIn={() => setShowCheckIn(true)}
          hideAdminItems={hideAdminItems}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          users={users}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onMonthYearChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
          onRefresh={handleRefresh}
          isRefreshing={summaryLoading || actionsLoading}
          hideUserDropdown={role === "user"}
        />
      </div>

      {/* KPI stat strip — live data from API */}
      {(() => {
        const d = summaryData;
        const stats = [
          { label: "Members",     value: summaryLoading ? "…" : String(d?.members?.total ?? 0),  sub: null,  color: "text-[#111928] dark:text-white" },
          { label: "Promises",    value: summaryLoading ? "…" : String(d?.promises    ?? 0),      sub: null,  color: "text-[#2563eb]" },
          { label: "Breakdowns",  value: summaryLoading ? "…" : String(d?.breakdowns  ?? 0),      sub: null,  color: "text-orange-400", resolvable: true },
          { label: "Escalations", value: summaryLoading ? "…" : String(d?.escalations ?? 0),      sub: null,  color: "text-[#111928] dark:text-white", resolvable: true },
          { label: "Requests",    value: summaryLoading ? "…" : String(d?.requests    ?? 0),      sub: null,  color: "text-[#111928] dark:text-white", resolvable: true },
          { label: "Due today",   value: summaryLoading ? "…" : String(d?.due_today   ?? 0),      sub: null,  color: "text-[#111928] dark:text-white" },
          { label: "Overdue",     value: summaryLoading ? "…" : String(d?.overdue     ?? 0),      sub: null,  color: "text-orange-400" },
          { label: "Check-In",    value: summaryLoading ? "…" : "0%",                              sub: null,  color: "text-orange-400" },
          { label: "Performance", value: summaryLoading ? "…" : (() => {
              const arr = d?.performance ?? [];
              if (arr.length === 0) return "0%";
              const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
              return `${Math.round(avg)}%`;
            })(), sub: "MTD avg", color: "text-[#2563eb]" },
        ].filter(s => !hideAdminItems || s.label !== "Performance");
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-3 flex flex-col gap-0.5 group relative">
                <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">{s.label}</span>
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                {s.sub && <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{s.sub}</span>}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Promises & Delivery Health — hidden for superadmin / admin */}
        {!isAdminRole && (
          <div className="lg:col-span-2 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-5">
            <h3 className="text-sm font-semibold text-[#111928] dark:text-white mb-3">Promises &amp; Delivery Health</h3>
            <div className="mb-2">
              <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Status</span>
              {/* Progress bar */}
              <div className="mt-2 relative h-2 rounded-full bg-[#E6EBF1] dark:bg-[#1F2A37] overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-full bg-[#2563eb]" style={{ width: "55%" }} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                  <span className="h-2 w-2 rounded-full bg-[#9CA3AF] inline-block" /> Draft <strong className="text-[#111928] dark:text-white ml-0.5">30</strong>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                  <span className="h-2 w-2 rounded-full bg-[#2563eb] inline-block" /> Active <strong className="text-[#111928] dark:text-white ml-0.5">36</strong>
                </span>
              </div>
            </div>

            {/* On track / At risk / Breaking / Review Score */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: "On track", value: "36", color: "text-[#2563eb]" },
                { label: "At risk",  value: "0",  color: "text-orange-400" },
                { label: "Breaking", value: "0",  color: "text-red-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] p-3">
                  <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{item.label}</span>
                  <p className={`text-2xl font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                </div>
              ))}

              {/* Review Score KPI */}
              <ReviewScoreCard />
            </div>

            <p className="text-[11px] text-[#2563eb] mt-4">21 active promises have no pathway yet.</p>
          </div>
        )}

        {/* Execution — spans full row when Promises box is hidden */}
        <div className={isAdminRole ? "lg:col-span-3 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-5" : "rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-5"}>
          <h3 className="text-sm font-semibold text-[#111928] dark:text-white mb-3">Execution</h3>

          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mb-2">
              <span>Check-in compliance (7d)</span>
              <span className="text-orange-400 font-semibold">
                Today: {summaryData ? `${summaryData.execution?.overall_percentage ?? 0}%` : "…"}
              </span>
            </div>
            {/* Day bars — live from API */}
            {(() => {
              const ex = summaryData?.execution as Record<string, DayExecution | number> | undefined;
              const days: { label: string; key: string }[] = [
                { label: "M", key: "monday" },
                { label: "T", key: "tuesday" },
                { label: "W", key: "wednesday" },
                { label: "T", key: "thursday" },
                { label: "F", key: "friday" },
                { label: "S", key: "saturday" },
                { label: "S", key: "sunday" },
              ];
              return (
                <div className="flex items-end gap-1.5 h-28">
                  {days.map(({ label, key }, i) => {
                    const day = ex?.[key] as DayExecution | undefined;
                    const pct = day?.percentage ?? 0;
                    const present = day?.present ?? 0;
                    const total = day?.total ?? 0;
                    const barH = summaryLoading ? 12 : Math.max(6, Math.round(pct * 1.0));
                    const barColor = pct >= 70 ? "bg-green-400" : pct >= 40 ? "bg-amber-400" : "bg-[#2563eb]/20 dark:bg-[#2563eb]/10";
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                          <div className="rounded-lg bg-[#1e2736] border border-[#374151] shadow-xl px-3 py-2 flex flex-col gap-0.5 text-left min-w-[90px]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[9px] text-[#9CA3AF]">Present</span>
                              <span className="text-[10px] font-semibold text-white">{present}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[9px] text-[#9CA3AF]">Total</span>
                              <span className="text-[10px] font-semibold text-white">{total}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 pt-0.5 border-t border-[#374151] mt-0.5">
                              <span className="text-[9px] text-[#9CA3AF]">Rate</span>
                              <span className="text-[10px] font-bold text-[#5750F1]">{pct}%</span>
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className="w-2 h-2 bg-[#1e2736] border-r border-b border-[#374151] rotate-45 mx-auto -mt-1" />
                        </div>
                        {/* Bar */}
                        <div className={`w-full rounded-sm ${barColor} transition-all cursor-default`} style={{ height: `${barH}px` }} />
                        <span className="text-[9px] text-[#9CA3AF]">{label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>


        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Breakdowns */}
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#111928] dark:text-white">Breakdowns</h3>
            <button
              onClick={() => setShowBreakdowns(true)}
              className="text-[11px] text-[#5750F1] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {actionsLoading ? (
              <p className="text-[11px] text-[#9CA3AF]">Loading…</p>
            ) : (actionsData?.breakdowns ?? []).length === 0 ? (
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">No breakdowns 🎉</p>
            ) : (
              (actionsData?.breakdowns ?? []).map((b) => (
                <div key={b.action_id} className="flex items-start justify-between gap-2 group">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditDrawer(b)}>
                    <p className="text-[11px] font-medium text-[#111928] dark:text-[#D1D5DB] truncate hover:text-[#5750F1] transition-colors">{b.title}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{b.pathway_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-orange-400/20 text-orange-400 text-[10px] font-semibold px-1.5 py-0.5">{b.age_days}d</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Escalations */}
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#111928] dark:text-white">Escalations</h3>
            <button className="text-[11px] text-[#5750F1] hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-2">
            {actionsLoading ? (
              <p className="text-[11px] text-[#9CA3AF]">Loading…</p>
            ) : (actionsData?.escalations ?? []).length === 0 ? (
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">No escalations 🎉</p>
            ) : (
              (actionsData?.escalations ?? []).map((e) => (
                <div key={e.action_id} className="flex items-start justify-between gap-2 group">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditDrawer(e)}>
                    <p className="text-[11px] font-medium text-[#111928] dark:text-[#D1D5DB] truncate hover:text-[#5750F1] transition-colors">{e.title}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{e.pathway_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-red-400/20 text-red-400 text-[10px] font-semibold px-1.5 py-0.5">{e.age_days}d</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Requests */}
        <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#111928] dark:text-white">Requests</h3>
            <button className="text-[11px] text-[#5750F1] hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-2">
            {actionsLoading ? (
              <p className="text-[11px] text-[#9CA3AF]">Loading…</p>
            ) : (actionsData?.requests ?? []).length === 0 ? (
              <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">No open requests.</p>
            ) : (
              (actionsData?.requests ?? []).map((r) => (
                <div key={r.action_id} className="flex items-start justify-between gap-2 group">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditDrawer(r)}>
                    <p className="text-[11px] font-medium text-[#111928] dark:text-[#D1D5DB] truncate hover:text-[#5750F1] transition-colors">{r.title}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{r.pathway_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-blue-400/20 text-blue-400 text-[10px] font-semibold px-1.5 py-0.5">{r.age_days}d</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ActionDrawer for editing actions */}
      {drawerRow && (
        <ActionDrawer
          row={drawerRow}
          performance="numbers"
          hideAddAnother
          pathwayId={pendingStrategyId}
          title={drawerRow.linkTo}
          onClose={() => { setDrawerRow(null); setPendingStrategyId(null); }}
          onSave={async (updated) => {
            try {
              const payload = {
                pathway_id: Number(pendingStrategyId),
                title: updated.action,
                intended_outcome: updated.intendedOutcome || "",
                category: (updated.category || "Breakdowns").toLowerCase(),
                platform: updated.platform || "Meta",
                status: (updated.status || "Planned").toLowerCase(),
                due_date: updated.due || undefined,
              };
              await api.put(`/api/v1/planner/pathways/actions/${updated.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
              });
              await fetchActions();
            } catch (err) {
              console.error("Failed to update action:", err);
            }
            setDrawerRow(null);
            setPendingStrategyId(null);
          }}
          onDelete={async (id) => {
            try {
              await api.delete(`/api/v1/planner/pathways/actions/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              await fetchActions();
            } catch (err) {
              console.error("Failed to delete action:", err);
            }
            setDrawerRow(null);
            setPendingStrategyId(null);
          }}
        />
      )}
    </div>
  );
}