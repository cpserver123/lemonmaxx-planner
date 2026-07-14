"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LuZap, LuX, LuChevronDown, LuCheck, LuLink2, LuEye,
  LuLink, LuTrash2, LuSave, LuUser, LuPlus,
  LuHeading1, LuHeading2, LuBold, LuItalic, LuList, LuListOrdered,
  LuQuote, LuTable, LuUndo2, LuRedo2, LuPaperclip, LuFile,
} from "react-icons/lu";

/* --- Types ----------------------------------------------------------- */
export interface DrawerRow {
  id:              string;
  action:          string;
  intendedOutcome: string;
  status:          string;
  due:             string;
  accountable:     string;
  linkTo:          string;
  pathwayTitle?:   string;
  pathwayDesc?:    string;
  additionalActions?: { id: string; action: string; intendedOutcome: string }[];
}

export type PerformanceTab = "numbers" | "creatives" | "experiments";

const PERFORMANCE_OPTIONS: { value: PerformanceTab; label: string }[] = [
  { value: "numbers",     label: "Numbers" },
  { value: "creatives",   label: "Creatives" },
  { value: "experiments", label: "Experiments" },
];

const CATEGORY_OPTIONS = ["Breakdowns", "Escalations", "Requests"] as const;
type Category = typeof CATEGORY_OPTIONS[number];

const PLATFORM_OPTIONS = ["Meta", "Taboola"] as const;
type Platform = typeof PLATFORM_OPTIONS[number];

/* --- Team Members ---------------------------------------------------- */
const TEAM_MEMBERS = [
  "Manish U.",
  "Sarah K.",
  "Raj P.",
  "Lisa T.",
  "Chris M.",
  "Yash Poonia",
  "Mukesh Kumar",
  "Arun S.",
  "Kapil N.",
  "Komal T.",
];

/* --- Status option --------------------------------------------------- */
const STATUS_OPTIONS = [
  { label: "Planned",        color: "bg-[#9CA3AF]/20 text-[#9CA3AF]" },
  { label: "Done",           color: "bg-green-500/20 text-green-500" },
  { label: "Not Done",       color: "bg-red-500/20 text-red-400" },
  { label: "Partially Done", color: "bg-orange-500/20 text-orange-400" },
  { label: "Cancelled",      color: "bg-[#6B7280]/20 text-[#6B7280]" },
  { label: "On Hold",        color: "bg-[#5750F1]/20 text-[#5750F1]" },
  { label: "In Progress",    color: "bg-green-500/20 text-green-500" },

];

function statusColor(status: string) {
  return STATUS_OPTIONS.find(s => s.label === status)?.color ?? STATUS_OPTIONS[0].color;
}

/* --- StatusDropdown -------------------------------------------------- */
function StatusDropdown({
  value, onChange,
}: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${statusColor(value)}`}
      >
        {value || "Planned"}
        <LuChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-44 rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1 overflow-hidden">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => { onChange(opt.label); setOpen(false); }}
              className="flex items-center justify-between gap-2 w-full px-3 py-2 text-xs hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
            >
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${opt.color}`}>
                {opt.label}
              </span>
              {value === opt.label && <LuCheck size={12} className="text-[#5750F1] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- AccountableDropdown --------------------------------------------- */
function AccountableDropdown({
  value, onChange,
}: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const filteredMembers = TEAM_MEMBERS.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className="flex items-center gap-1.5 text-xs text-[#111928] dark:text-white hover:text-[#5750F1] dark:hover:text-[#7c78f3] transition-colors"
      >
        {value ? (
          <>
            <div className="h-5 w-5 rounded-full bg-[#2563eb] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {initials(value)}
            </div>
            <span>{value}</span>
          </>
        ) : (
          <>
            <LuUser size={13} className="text-[#9CA3AF]" />
            <span className="text-[#9CA3AF]">Select person</span>
          </>
        )}
        <LuChevronDown size={11} className="text-[#9CA3AF]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl overflow-hidden">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#374151]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-[#9CA3AF] shrink-0">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
              onClick={e => e.stopPropagation()}
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white">
                <LuX size={11} />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[200px] overflow-y-auto py-1">
            {/* Unassign option — only show if not filtering */}
            {!search && (
              <button
                onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <LuUser size={13} />
                <span>Unassigned</span>
                {!value && <LuCheck size={12} className="text-[#5750F1] ml-auto shrink-0" />}
              </button>
            )}
            {filteredMembers.length > 0 ? filteredMembers.map(name => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <div className="h-5 w-5 rounded-full bg-[#2563eb] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                  {initials(name)}
                </div>
                <span className="text-[#111928] dark:text-[#D1D5DB]">{name}</span>
                {value === name && <LuCheck size={12} className="text-[#5750F1] ml-auto shrink-0" />}
              </button>
            )) : (
              <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/* --- Section row ----------------------------------------------------- */
function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
      <span className="w-28 shrink-0 text-[11px] text-[#9CA3AF] font-medium flex items-center gap-1.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* --- Inline list section (Links / Watchers / Dependencies) ----------- */
function ListSection({
  icon,
  title,
  items,
  onAdd,
  onRemove,
  placeholder,
  emptyText,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  emptyText: string;
}) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    onAdd(inputValue.trim());
    setInputValue("");
    setShowInput(false);
  };

  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  return (
    <div className="border-t border-[#E6EBF1] dark:border-[#1F2A37] pt-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#111928] dark:text-white">
          {icon} {title}
        </span>
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-[11px] text-[#5750F1] hover:opacity-80"
        >
          <LuPlus size={12} /> Add
        </button>
      </div>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] flex-1 truncate">{item}</span>
              <button
                onClick={() => onRemove(i)}
                className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-red-400 transition-all"
              >
                <LuX size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add input */}
      {showInput && (
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setShowInput(false); setInputValue(""); }
            }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0a1018] px-2.5 py-1.5 text-[11px] text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#5750F1]"
          />
          <button
            onClick={handleAdd}
            className="h-6 w-6 shrink-0 rounded-md bg-[#5750F1] flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <LuCheck size={11} className="text-white" />
          </button>
          <button
            onClick={() => { setShowInput(false); setInputValue(""); }}
            className="h-6 w-6 shrink-0 rounded-md border border-[#E6EBF1] dark:border-[#374151] flex items-center justify-center text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"
          >
            <LuX size={11} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showInput && (
        <p className="text-[11px] text-[#9CA3AF]">{emptyText}</p>
      )}
    </div>
  );
}

/* --- Rich Text Editor ------------------------------------------------ */
function RichEditor() {
  const editorRef  = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  /* Keep toolbar active-state in sync with cursor position */
  const syncFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold"))         formats.add("bold");
    if (document.queryCommandState("italic"))       formats.add("italic");
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList"))   formats.add("ol");
    const block = document.queryCommandValue("formatBlock").toLowerCase();
    if (block === "h1")         formats.add("h1");
    if (block === "h2")         formats.add("h2");
    if (block === "blockquote") formats.add("quote");
    setActiveFormats(formats);
  }, []);

  /* Focus the contentEditable area before running a command */
  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();

    if (cmd === "formatBlock" && value) {
      // Toggle off: if we're already in this block type, revert to paragraph
      const currentBlock = document.queryCommandValue("formatBlock").toLowerCase();
      const target = value.replace(/[<>]/g, "").toLowerCase();
      if (currentBlock === target) {
        document.execCommand("formatBlock", false, "<P>");
      } else {
        document.execCommand("formatBlock", false, value);
      }
    } else {
      // bold / italic / UL / OL toggle natively; pass empty string as fallback
      document.execCommand(cmd, false, value ?? "");
    }

    syncFormats();
  }, [syncFormats]);

  /* Insert a basic 2x2 HTML table */
  const insertTable = useCallback(() => {
    editorRef.current?.focus();
    const table = `
      <table style="border-collapse:collapse;width:100%;margin:4px 0">
        <tbody>
          <tr>
            <td style="border:1px solid #374151;padding:4px 8px;min-width:60px">&ZeroWidthSpace;</td>
            <td style="border:1px solid #374151;padding:4px 8px;min-width:60px">&ZeroWidthSpace;</td>
          </tr>
          <tr>
            <td style="border:1px solid #374151;padding:4px 8px">&ZeroWidthSpace;</td>
            <td style="border:1px solid #374151;padding:4px 8px">&ZeroWidthSpace;</td>
          </tr>
        </tbody>
      </table><br/>`;
    document.execCommand("insertHTML", false, table);
    syncFormats();
  }, [syncFormats]);

  interface ToolbarBtn {
    id:     string;
    label:  React.ReactNode;
    action: () => void;
  }

  const TOOLBAR: ToolbarBtn[] = [
    { id: "h1",    label: <LuHeading1    size={13} />, action: () => exec("formatBlock", "<H1>") },
    { id: "h2",    label: <LuHeading2    size={13} />, action: () => exec("formatBlock", "<H2>") },
    { id: "bold",  label: <LuBold        size={13} />, action: () => exec("bold") },
    { id: "italic",label: <LuItalic      size={13} />, action: () => exec("italic") },
    { id: "ul",    label: <LuList        size={13} />, action: () => exec("insertUnorderedList") },
    { id: "ol",    label: <LuListOrdered size={13} />, action: () => exec("insertOrderedList") },
    { id: "quote", label: <LuQuote       size={13} />, action: () => exec("formatBlock", "<BLOCKQUOTE>") },
    { id: "table", label: <LuTable       size={13} />, action: insertTable },
  ];

  return (
    <div className="rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] mb-5 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E6EBF1] dark:border-[#1F2A37] flex-wrap bg-[#F9FAFB] dark:bg-[#0a1018]">
        {TOOLBAR.map(btn => (
          <button
            key={btn.id}
            onMouseDown={e => { e.preventDefault(); btn.action(); }}
            title={btn.id.toUpperCase()}
            className={`p-1.5 rounded transition-colors ${
              activeFormats.has(btn.id)
                ? "bg-[#5750F1]/20 text-[#5750F1] dark:text-[#818CF8]"
                : "text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] hover:text-[#111928] dark:hover:text-white"
            }`}
          >
            {btn.label}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-[#E6EBF1] dark:bg-[#374151]" />

        {/* Undo */}
        <button
          onMouseDown={e => { e.preventDefault(); exec("undo"); }}
          title="Undo"
          className="p-1.5 rounded text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] hover:text-[#111928] dark:hover:text-white transition-colors"
        >
          <LuUndo2 size={13} />
        </button>
        {/* Redo */}
        <button
          onMouseDown={e => { e.preventDefault(); exec("redo"); }}
          title="Redo"
          className="p-1.5 rounded text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] hover:text-[#111928] dark:hover:text-white transition-colors"
        >
          <LuRedo2 size={13} />
        </button>
      </div>

      {/* Content area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyUp={syncFormats}
        onMouseUp={syncFormats}
        onSelect={syncFormats}
        data-placeholder="Add more detail..."
        className={[
          "min-h-[100px] px-3 py-2 text-sm text-[#111928] dark:text-[#D1D5DB] outline-none",
          "focus:ring-0",
          "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-1",
          "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-1",
          "[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-1",
          "[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-1",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-[#5750F1] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#6B7280]",
          "[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[#374151] [&_td]:p-1",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-[#9CA3AF] empty:before:pointer-events-none",
        ].join(" ")}
      />
    </div>
  );
}

/* --- SimpleDropdown -------------------------------------------------- */
function SimpleDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[] | readonly T[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const normalised = (options as (string | { value: T; label: string })[]).map(o =>
    typeof o === "string" ? { value: o as T, label: o } : o
  );

  const currentLabel = normalised.find(o => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-2.5 py-1 text-xs font-medium text-[#111928] dark:text-[#D1D5DB] hover:border-[#5750F1]/50 transition-colors"
      >
        {currentLabel}
        <LuChevronDown size={11} className="text-[#9CA3AF]" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl py-1 overflow-hidden">
          {normalised.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex items-center justify-between gap-2 w-full px-3 py-2 text-xs hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
            >
              <span className="text-[#111928] dark:text-[#D1D5DB]">{opt.label}</span>
              {value === opt.value && <LuCheck size={12} className="text-[#5750F1] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- ActionDrawer ---------------------------------------------------- */
export default function ActionDrawer({
  row,
  title,
  isPathway,
  onClose,
  onSave,
  onDelete,
  performance: initialPerformance,
}: {
  row:          DrawerRow | null;
  title?:       string;
  isPathway?:   boolean;
  onClose:      () => void;
  onSave:       (updated: DrawerRow) => void;
  onDelete:     (id: string) => void;
  /** When provided, shows the Performance / Category / Platform dropdowns */
  performance?: PerformanceTab | null;
}) {
  const [draft, setDraft] = useState<DrawerRow | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checkInput, setCheckInput] = useState("");

  // Links, Watchers, Dependencies
  const [links, setLinks] = useState<string[]>([]);
  const [watchers, setWatchers] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Attachments
  const [attachments, setAttachments] = useState<{ name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Performance / Category / Platform state
  const [perfTab, setPerfTab] = useState<PerformanceTab>(initialPerformance ?? "numbers");
  const [category, setCategory] = useState<Category>("Breakdowns");
  const [platform, setPlatform] = useState<Platform>("Meta");

  // Sync draft when row changes
  useEffect(() => {
    setDraft(row ? { ...row } : null);
    setChecklist([]);
    setCheckInput("");
    setLinks([]);
    setWatchers([]);
    setDependencies([]);
    setAttachments([]);
    // Reset perf dropdowns to the caller's default
    if (initialPerformance) setPerfTab(initialPerformance);
    setCategory("Breakdowns");
    setPlatform("Meta");
  }, [row]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOpen = !!row;

  const addCheckItem = () => {
    if (!checkInput.trim()) return;
    setChecklist(c => [...c, checkInput.trim()]);
    setCheckInput("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({ name: f.name, size: f.size }));
    setAttachments(prev => [...prev, ...newFiles]);
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!draft) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[600px] bg-white dark:bg-[#0d1520] border-l border-[#E6EBF1] dark:border-[#1F2A37] flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
          <div className="flex items-center gap-2">
            <LuZap size={16} className="text-[#2563eb]" />
            <span className="text-sm font-semibold text-[#111928] dark:text-white">
              {isPathway ? "Create Pathway" : "Edit Action"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
          >
            <LuX size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Main title (from pathway) */}
          {title && !isPathway && (
            <div className="mb-2">
              <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Pathway</span>
              <h2 className="text-sm font-bold text-[#111928] dark:text-white mt-0.5">{title}</h2>
            </div>
          )}

          {isPathway && (
            <div className="mb-6 pb-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
              <textarea
                value={draft.pathwayTitle || ""}
                onChange={e => setDraft(d => d ? { ...d, pathwayTitle: e.target.value } : d)}
                placeholder="Pathway title..."
                rows={1}
                className="w-full resize-none text-lg font-bold text-[#111928] dark:text-white bg-transparent border-none outline-none placeholder:text-[#9CA3AF] leading-snug mb-2"
              />
              <input
                type="text"
                value={draft.pathwayDesc || ""}
                onChange={e => setDraft(d => d ? { ...d, pathwayDesc: e.target.value } : d)}
                placeholder="Click to add description..."
                className="w-full text-xs text-[#111928] dark:text-[#D1D5DB] bg-transparent border-none outline-none placeholder:text-[#9CA3AF] py-1 hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] rounded px-1 -ml-1 transition-colors focus:bg-[#F3F4F6] dark:focus:bg-[#1a2332]"
              />
            </div>
          )}

          {/* Action Title */}
          <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest block mb-2">Action Title</span>
          <textarea
            value={draft.action}
            onChange={e => setDraft(d => d ? { ...d, action: e.target.value } : d)}
            placeholder="Action title..."
            rows={2}
            className="w-full resize-none text-base font-semibold text-[#111928] dark:text-white bg-transparent border-none outline-none placeholder:text-[#9CA3AF] leading-snug mb-1"
          />
          {/* Intended outcome — editable */}
          <input
            type="text"
            value={draft.intendedOutcome}
            onChange={e => setDraft(d => d ? { ...d, intendedOutcome: e.target.value } : d)}
            placeholder="Click to add intended outcome..."
            className="w-full text-xs text-[#111928] dark:text-[#D1D5DB] bg-transparent border-none outline-none placeholder:text-[#9CA3AF] mb-4 py-1 hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] rounded px-1 -ml-1 transition-colors focus:bg-[#F3F4F6] dark:focus:bg-[#1a2332]"
          />

          {/* Additional Actions */}
          {draft.additionalActions?.map((add, idx) => (
            <div key={add.id} className="mb-4 relative border-l-2 border-[#5750F1]/30 pl-3">
              <button
                onClick={() => setDraft(d => d ? { ...d, additionalActions: d.additionalActions?.filter(a => a.id !== add.id) } : d)}
                className="absolute -left-[9px] top-1 text-[#9CA3AF] hover:text-red-500 bg-white dark:bg-[#0d1520] transition-colors"
                title="Remove action"
              >
                <LuX size={14} />
              </button>
              <textarea
                value={add.action}
                onChange={e => setDraft(d => {
                  if (!d) return d;
                  const newActs = [...(d.additionalActions || [])];
                  newActs[idx].action = e.target.value;
                  return { ...d, additionalActions: newActs };
                })}
                placeholder="Action title..."
                rows={2}
                className="w-full resize-none text-base font-semibold text-[#111928] dark:text-white bg-transparent border-none outline-none placeholder:text-[#9CA3AF] leading-snug mb-1"
              />
              <input
                type="text"
                value={add.intendedOutcome}
                onChange={e => setDraft(d => {
                  if (!d) return d;
                  const newActs = [...(d.additionalActions || [])];
                  newActs[idx].intendedOutcome = e.target.value;
                  return { ...d, additionalActions: newActs };
                })}
                placeholder="Click to add intended outcome..."
                className="w-full text-xs text-[#111928] dark:text-[#D1D5DB] bg-transparent border-none outline-none placeholder:text-[#9CA3AF] py-1 hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] rounded px-1 -ml-1 transition-colors focus:bg-[#F3F4F6] dark:focus:bg-[#1a2332]"
              />
            </div>
          ))}

          <button
            onClick={() => setDraft(d => d ? { ...d, additionalActions: [...(d.additionalActions || []), { id: crypto.randomUUID(), action: "", intendedOutcome: "" }] } : d)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#5750F1] hover:text-[#5750F1]/80 transition-colors mb-6"
          >
            <LuPlus size={14} />
            Add another action
          </button>

          {/* Category / Platform — only when opened from a bloodsugar tab */}
          {initialPerformance != null && (
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-[#E6EBF1] dark:border-[#1F2A37]">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Category</span>
                <SimpleDropdown<Category>
                  label="Category"
                  value={category}
                  options={CATEGORY_OPTIONS}
                  onChange={setCategory}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Platform</span>
                <SimpleDropdown<Platform>
                  label="Platform"
                  value={platform}
                  options={PLATFORM_OPTIONS}
                  onChange={setPlatform}
                />
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="mb-4">
            <SectionRow label="● Status">
              <StatusDropdown
                value={draft.status}
                onChange={s => setDraft(d => d ? { ...d, status: s } : d)}
              />
            </SectionRow>

            <SectionRow label="📅Due Dates">
              <input
                type="date"
                value={draft.due}
                onChange={e => setDraft(d => d ? { ...d, due: e.target.value } : d)}
                className="text-xs text-[#111928] dark:text-white bg-transparent border-none outline-none"
              />
            </SectionRow>

            <SectionRow label="👤 Accountable">
              <AccountableDropdown
                value={draft.accountable}
                onChange={name => setDraft(d => d ? { ...d, accountable: name } : d)}
              />
            </SectionRow>

            <SectionRow label="👤 To Whom">
              <AccountableDropdown
                value={draft.linkTo}
                onChange={name => setDraft(d => d ? { ...d, linkTo: name } : d)}
              />
            </SectionRow>
          </div>

          {/* Rich text editor */}
          <RichEditor />

         

          {/* Attachments */}
          <div className="border-t border-[#E6EBF1] dark:border-[#1F2A37] pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#111928] dark:text-white">
                <LuPaperclip size={13} /> Attachments
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-[#5750F1] hover:opacity-80"
              >
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {attachments.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 group rounded-md bg-[#F3F4F6] dark:bg-[#0a1018] px-2.5 py-1.5">
                    <LuFile size={12} className="text-[#5750F1] shrink-0" />
                    <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] flex-1 truncate">{file.name}</span>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0">{formatFileSize(file.size)}</span>
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-red-400 transition-all"
                    >
                      <LuX size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#9CA3AF]">No attachments yet</p>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520]">
             <button
            onClick={() => { onSave(draft); onClose(); }}
            className="flex items-center gap-1.5 rounded-lg bg-[#5750F1] text-white px-5 py-2 text-xs font-semibold hover:bg-[#4742d4] transition-colors"
          >
            <LuSave size={13} />
            Save changes
          </button>
          
          <button
            onClick={() => { onDelete(draft.id); onClose(); }}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 px-4 py-2 text-xs font-semibold hover:bg-red-500/20 transition-colors"
          >
            <LuTrash2 size={13} />
            Delete
          </button>
       
        </div>
      </div>
    </>
  );
}
