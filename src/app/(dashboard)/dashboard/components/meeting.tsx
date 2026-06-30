"use client";

import { useState, useMemo } from "react";
import {
  LuPlus, LuX, LuCalendar, LuClock, LuMapPin, LuFileText,
  LuChevronDown, LuUsers, LuListChecks, LuPaperclip, LuSparkles,
  LuVideo, LuRepeat, LuChevronLeft, LuChevronRight,
} from "react-icons/lu";

/* --- Types -------------------------------------------------------------- */
interface MeetingForm {
  name:            string;
  intention:       string;
  type:            string;
  duration:        string;
  recurrence:      string;
  dueDate:         string;
  dueTime:         string;
  expectedOutcome: string;
  location:        string;
  description:     string;
  isExternal:      boolean;
  isPrivate:       boolean;
}

const BLANK: MeetingForm = {
  name:            "",
  intention:       "",
  type:            "Review",
  duration:        "",
  recurrence:      "One-time",
  dueDate:         "",
  dueTime:         "9:00 AM",
  expectedOutcome: "",
  location:        "",
  description:     "",
  isExternal:      false,
  isPrivate:       false,
};

const MEETING_TYPES = ["Review", "Planning", "Standup", "1-on-1", "Retrospective", "Workshop", "Other"];
const RECURRENCES   = ["One-time", "Daily", "Weekly", "Bi-weekly", "Monthly"];

/* --- Shared input class ------------------------------------------------- */
const inputCls =
  "w-full rounded-lg border border-[#D1D5DB] dark:border-[#374151] " +
  "bg-[#F9FAFB] dark:bg-[#0a1628] " +
  "px-3 py-2.5 text-sm " +
  "text-[#111928] dark:text-white " +
  "placeholder:text-[#9CA3AF] " +
  "outline-none focus:border-[#2563eb] dark:focus:border-[#2563eb] transition-colors";

/* --- Field helpers ------------------------------------------------------ */
function Label({ text, optional }: { text: string; optional?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-[#111928] dark:text-[#E5E7EB] mb-1.5">
      {text}
      {!optional && <span className="text-[#2563eb] ml-0.5">*</span>}
      {optional && <span className="text-[#9CA3AF] font-normal ml-1 text-xs">(optional)</span>}
    </label>
  );
}

function MInput({ placeholder, value, onChange, type = "text" }: {
  placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function SelectField({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${inputCls} appearance-none cursor-pointer`}
      >
        {options.map(o => <option key={o} className="bg-white dark:bg-[#0a1628]">{o}</option>)}
      </select>
      <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex items-center justify-center rounded border transition-colors ${
          checked
            ? "border-[#2563eb] bg-[#2563eb]/10"
            : "border-[#D1D5DB] dark:border-[#374151] bg-transparent"
        }`}
        style={{ width: 18, height: 18, minWidth: 18 }}
      >
        {checked && <span className="block h-2 w-2 rounded-sm bg-[#2563eb]" />}
      </button>
      <span className="text-sm font-medium text-[#374151] dark:text-[#D1D5DB]">{label}</span>
    </label>
  );
}

/* --- Inline field with icon --------------------------------------------- */
function IconInput({ placeholder, value, onChange, icon }: {
  placeholder: string; value: string; onChange: (v: string) => void; icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-9`}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</span>
    </div>
  );
}

/* --- Section heading (right panel) -------------------------------------- */
function RightHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#6B7280] dark:text-[#9CA3AF]">{icon}</span>
      <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest">{label}</p>
    </div>
  );
}

/* --- Create Meeting Modal ---------------------------------------------- */
type ModalTab = "design" | "reports" | "ai-summary";

function CreateMeetingModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (name: string) => void }) {
  const [tab, setTab] = useState<ModalTab>("design");
  const [form, setForm] = useState<MeetingForm>(BLANK);

  const set = (field: keyof MeetingForm) => (value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = () => {
    if (form.name.trim()) onCreated?.(form.name.trim());
    onClose();
    setForm(BLANK);
  };

  const TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: "design",     label: "Design",     icon: <LuListChecks size={13} /> },
    { id: "reports",    label: "Reports",    icon: <LuFileText size={13} /> },
    { id: "ai-summary", label: "AI Summary", icon: <LuSparkles size={13} /> },
  ];

  /* Panel bg + border tokens that work in both modes */
  const panelBg     = "bg-white dark:bg-[#0d1520]";
  const borderColor = "border-[#E5E7EB] dark:border-[#1F2A37]";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[900px] ${panelBg} border-l ${borderColor} flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b ${borderColor} shrink-0`}>
          <button onClick={onClose} className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuX size={16} />
          </button>
          <LuVideo size={16} className="text-[#2563eb]" />
          <span className="text-sm font-bold text-[#111928] dark:text-white">New Meeting</span>
        </div>

        {/* Tab bar */}
        <div className={`flex border-b ${borderColor} shrink-0`}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? "border-[#2563eb] text-[#2563eb]"
                  : `border-transparent text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white`
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        {tab === "design" && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left form panel */}
            <div className={`flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 border-r ${borderColor}`}>

              {/* Name */}
              <div>
                <Label text="Name" />
                <MInput placeholder="e.g., Weekly Sprint Planning" value={form.name} onChange={set("name")} />
              </div>

              {/* Intention */}
              <div>
                <Label text="Intention" optional />
                <textarea
                  value={form.intention}
                  onChange={e => set("intention")(e.target.value)}
                  placeholder="What is the purpose of this meeting?"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Type & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="Type" />
                  <SelectField value={form.type} onChange={set("type")} options={MEETING_TYPES} />
                </div>
                <div>
                  <Label text="Duration (min)" />
                  <MInput placeholder="--" value={form.duration} onChange={set("duration")} type="number" />
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <Label text="Recurrence" />
                <div className="relative">
                  <select
                    value={form.recurrence}
                    onChange={e => set("recurrence")(e.target.value)}
                    className={`${inputCls} appearance-none cursor-pointer border-2 border-[#2563eb] focus:border-[#2563eb]`}
                  >
                    {RECURRENCES.map(r => <option key={r} className="bg-white dark:bg-[#0a1628]">{r}</option>)}
                  </select>
                  <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="Due Date" />
                  <IconInput
                    placeholder="e.g. May 21, 2026"
                    value={form.dueDate}
                    onChange={set("dueDate")}
                    icon={<LuCalendar size={14} />}
                  />
                </div>
                <div>
                  <Label text="Due Time" />
                  <IconInput
                    placeholder="9:00 AM"
                    value={form.dueTime}
                    onChange={set("dueTime")}
                    icon={<LuClock size={14} />}
                  />
                </div>
              </div>

              {/* Expected Outcome */}
              <div>
                <Label text="Expected Outcome" />
                <textarea
                  value={form.expectedOutcome}
                  onChange={e => set("expectedOutcome")(e.target.value)}
                  placeholder="What should be achieved in this meeting?"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Location */}
              <div>
                <Label text="Location" optional />
                <IconInput
                  placeholder="Room name or address"
                  value={form.location}
                  onChange={set("location")}
                  icon={<LuMapPin size={14} />}
                />
              </div>

              {/* Description / Notes */}
              <div>
                <Label text="Description / Notes" optional />
                <textarea
                  value={form.description}
                  onChange={e => set("description")(e.target.value)}
                  placeholder="Paste a Zoom / Google Meet link or any notes for participants"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                <Checkbox
                  checked={form.isExternal}
                  onChange={v => set("isExternal")(v)}
                  label="External meeting (with external participants)"
                />
                <Checkbox
                  checked={form.isPrivate}
                  onChange={v => set("isPrivate")(v)}
                  label="Private meeting (only participants can see it)"
                />
              </div>

              {/* Participants section */}
              <div>
                <p className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest mb-3">Participants</p>
                <div className={`rounded-lg border ${borderColor} bg-[#F9FAFB] dark:bg-[#0a1628] px-4 py-6 text-center`}>
                  <LuUsers size={18} className="mx-auto text-[#D1D5DB] dark:text-[#374151] mb-2" />
                  <p className="text-xs text-[#9CA3AF]">Save the meeting first to add participants</p>
                </div>
              </div>
            </div>

            {/* Right info panel */}
            <div className={`w-64 shrink-0 overflow-y-auto px-5 py-5 flex flex-col gap-6 bg-[#F9FAFB] dark:bg-[#080f1a]`}>

              {/* Agenda */}
              <div>
                <RightHeading icon={<LuListChecks size={13} />} label="Agenda" />
                <p className="text-xs text-[#9CA3AF] text-center py-4">Save the meeting first to add agenda items</p>
              </div>

              <div className={`h-px bg-[#E5E7EB] dark:bg-[#1F2A37]`} />

              {/* Prework */}
              <div>
                <RightHeading icon={<LuRepeat size={13} />} label="Prework" />
                <p className="text-xs text-[#9CA3AF] text-center py-4">Save the meeting first to add prework actions</p>
              </div>

              <div className={`h-px bg-[#E5E7EB] dark:bg-[#1F2A37]`} />

              {/* Files */}
              <div>
                <RightHeading icon={<LuPaperclip size={13} />} label="Files" />
                <p className="text-xs text-[#9CA3AF] text-center py-4">Save the meeting first to add files</p>
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">
            Save the meeting first to view reports.
          </div>
        )}

        {tab === "ai-summary" && (
          <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm">
            Save the meeting first to generate an AI summary.
          </div>
        )}

        {/* Footer */}
        <div className={`flex gap-3 px-6 py-4 border-t ${borderColor} shrink-0 ${panelBg}`}>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#D1D5DB] dark:border-[#374151] py-3 text-sm font-semibold text-[#374151] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.name.trim()}
            className="flex-1 rounded-lg bg-[#2563eb] py-3 text-sm font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Meeting
          </button>
        </div>
      </div>
    </>
  );
}

/* --- Calendar types & helpers ------------------------------------------- */
interface MeetingEvent {
  id:       string;
  title:    string;
  dayOfWeek: number;   // 0=Mon ... 6=Sun
  startHr:  number;
  startMin: number;
  endHr:    number;
  endMin:   number;
  color:    string;
}

const EVENT_COLORS = ["#2563eb", "#7c3aed", "#065f46", "#5750F1", "#f59e0b", "#ec4899", "#06b6d4"];

const DUMMY_EVENTS: MeetingEvent[] = [
  { id: "e1", title: "Weekly Sprint Planning",  dayOfWeek: 0, startHr: 9,  startMin: 0,  endHr: 10, endMin: 0,  color: "#2563eb" },
  { id: "e2", title: "VSL Daily Standup",        dayOfWeek: 0, startHr: 7,  startMin: 0,  endHr: 8,  endMin: 0,  color: "#065f46" },
  { id: "e3", title: "1-on-1 with Arun",         dayOfWeek: 1, startHr: 10, startMin: 30, endHr: 11, endMin: 0,  color: "#7c3aed" },
  { id: "e4", title: "Team Retrospective",       dayOfWeek: 2, startHr: 14, startMin: 0,  endHr: 15, endMin: 0,  color: "#f59e0b" },
  { id: "e5", title: "performance",          dayOfWeek: 3, startHr: 7,  startMin: 0,  endHr: 8,  endMin: 0,  color: "#5750F1" },
  { id: "e6", title: "Onboarding Session",       dayOfWeek: 3, startHr: 9,  startMin: 0,  endHr: 10, endMin: 30, color: "#06b6d4" },
  { id: "e7", title: "KPI Review",               dayOfWeek: 4, startHr: 13, startMin: 0,  endHr: 14, endMin: 0,  color: "#ec4899" },
];

const HOURS_CAL = [6,7,8,9,10,11,12,13,14,15,16,17,18];
const PX_PER_HOUR_CAL = 64;
const DAY_COL_W = 130;
const TIME_COL_W = 56;
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const LONG_MONTHS_CAL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_NAMES_CAL = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function calTop(hr: number, min: number) {
  return ((hr - HOURS_CAL[0]) + min / 60) * PX_PER_HOUR_CAL;
}
function calHeight(sHr: number, sMin: number, eHr: number, eMin: number) {
  return Math.max(((eHr - sHr) + (eMin - sMin) / 60) * PX_PER_HOUR_CAL, 20);
}

/** Get Monday of the week containing `date` */
function getMonday(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0,0,0,0);
  return m;
}

/* --- Meeting Calendar --------------------------------------------------- */
function MeetingCalendar({ events }: { events: MeetingEvent[] }) {
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate()-7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate()+7); return n; });
  const goToday  = () => setWeekStart(getMonday(today));

  // Label = month(s) + year of the displayed week
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const label = weekStart.getMonth() === weekEnd.getMonth()
    ? `${LONG_MONTHS_CAL[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTH_NAMES_CAL[weekStart.getMonth()]} - ${MONTH_NAMES_CAL[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  // Day header dates (Mon-Sun)
  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });

  const totalH = HOURS_CAL.length * PX_PER_HOUR_CAL;
  const allEvents = [...DUMMY_EVENTS, ...events];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronLeft size={14} />
          </button>

          {/* Month picker */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(p => !p)}
              className="flex items-center gap-1.5 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-2.5 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#2563eb]/40 transition-colors"
            >
              <LuCalendar size={12} className="text-[#9CA3AF]" />
              {label}
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setPickerYear(y => y-1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronLeft size={13}/></button>
                    <span className="text-sm font-semibold text-[#111928] dark:text-white">{pickerYear}</span>
                    <button onClick={() => setPickerYear(y => y+1)} className="p-1 rounded text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"><LuChevronRight size={13}/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES_CAL.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => {
                          const target = new Date(pickerYear, i, 1);
                          setWeekStart(getMonday(target));
                          setPickerMonth(i);
                          setShowPicker(false);
                        }}
                        className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          i === pickerMonth && pickerYear === weekStart.getFullYear()
                            ? "bg-[#2563eb] text-white"
                            : "text-[#111928] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]"
                        }`}
                      >{m}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={nextWeek} className="p-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors">
            <LuChevronRight size={14} />
          </button>
          <button onClick={goToday} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#2563eb]/40 transition-colors">
            This Week
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: TIME_COL_W + 7 * DAY_COL_W }}>

            {/* Day header */}
            <div
              className="flex border-b border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] sticky top-0 z-20"
              style={{ paddingLeft: TIME_COL_W }}
            >
              {dayDates.map((d, di) => {
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div
                    key={di}
                    className="flex flex-col items-center justify-center py-2.5 border-l border-[#E6EBF1] dark:border-[#1F2A37] shrink-0"
                    style={{ width: DAY_COL_W }}
                  >
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase">{DAYS_SHORT[di]}</span>
                    <span className={`text-sm font-bold mt-0.5 ${
                      isToday ? "text-[#2563eb]" : "text-[#111928] dark:text-white"
                    }`}>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="flex" style={{ height: totalH }}>
              {/* Time labels */}
              <div className="shrink-0 relative" style={{ width: TIME_COL_W, height: totalH }}>
                {HOURS_CAL.map((h, i) => (
                  <div
                    key={h}
                    className="absolute right-2 text-[9px] text-[#9CA3AF] font-medium"
                    style={{ top: i * PX_PER_HOUR_CAL - 6 }}
                  >
                    {String(h).padStart(2,"0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {dayDates.map((_, di) => {
                const colEvents = allEvents.filter(e => e.dayOfWeek === di);
                return (
                  <div
                    key={di}
                    className="border-l border-[#E6EBF1] dark:border-[#1F2A37] relative shrink-0"
                    style={{ width: DAY_COL_W, height: totalH }}
                  >
                    {/* Hour lines */}
                    {HOURS_CAL.map((_, hi) => (
                      <div
                        key={hi}
                        className="absolute left-0 right-0 border-t border-[#E6EBF1] dark:border-[#1F2A37]"
                        style={{ top: hi * PX_PER_HOUR_CAL }}
                      />
                    ))}
                    {/* Events */}
                    {colEvents.map((ev) => {
                      const top    = calTop(ev.startHr, ev.startMin);
                      const height = calHeight(ev.startHr, ev.startMin, ev.endHr, ev.endMin);
                      return (
                        <div
                          key={ev.id}
                          className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            top:        top + 1,
                            height:     height - 2,
                            background: ev.color + "cc",
                            borderLeft: `3px solid ${ev.color}`,
                          }}
                        >
                          <p className="text-[9px] font-semibold text-white leading-tight line-clamp-3">{ev.title}</p>
                          <p className="text-[8px] text-white/70 mt-0.5">
                            {String(ev.startHr).padStart(2,"0")}:{String(ev.startMin).padStart(2,"0")}-{String(ev.endHr).padStart(2,"0")}:{String(ev.endMin).padStart(2,"0")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingSection() {
  const [showModal, setShowModal] = useState(false);
  const [calEvents, setCalEvents] = useState<MeetingEvent[]>([]);
  const colorIdx = { current: 0 };

  const handleCreated = (name: string) => {
    const color = EVENT_COLORS[colorIdx.current % EVENT_COLORS.length];
    colorIdx.current++;
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Sun=0 → Mon=0
    setCalEvents(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: name, dayOfWeek, startHr: 9, startMin: 0, endHr: 10, endMin: 0, color },
    ]);
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#111928] dark:text-white">Meetings</h2>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">Schedule and manage your team meetings</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-bold text-white hover:bg-[#1d4ed8] transition-colors"
        >
          <LuPlus size={15} />
          Create Meeting
        </button>
      </div>

      {/* Calendar */}
      <MeetingCalendar events={calEvents} />

      {/* Modal */}
      <CreateMeetingModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}