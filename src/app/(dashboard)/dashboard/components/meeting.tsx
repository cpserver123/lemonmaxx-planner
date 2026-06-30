"use client";

import { useState } from "react";
import {
  LuPlus, LuX, LuCalendar, LuClock, LuMapPin, LuFileText,
  LuChevronDown, LuUsers, LuListChecks, LuPaperclip, LuSparkles,
  LuVideo, LuRepeat,
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

function CreateMeetingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<ModalTab>("design");
  const [form, setForm] = useState<MeetingForm>(BLANK);

  const set = (field: keyof MeetingForm) => (value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = () => {
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

/* --- Main Component ----------------------------------------------------- */
export default function MeetingSection() {
  const [showModal, setShowModal] = useState(false);

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

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2563eb]/10 mb-4">
          <LuVideo size={22} className="text-[#2563eb]" />
        </div>
        <h3 className="text-sm font-semibold text-[#111928] dark:text-white mb-1">No meetings yet</h3>
        <p className="text-xs text-[#9CA3AF] mb-5">Create your first meeting to get started</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#2563eb] px-4 py-2 text-sm font-semibold text-[#2563eb] hover:bg-[#2563eb]/10 transition-colors"
        >
          <LuPlus size={13} />
          Create Meeting
        </button>
      </div>

      {/* Modal */}
      <CreateMeetingModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}