"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LuZap, LuX, LuChevronDown, LuCheck, LuLink2, LuEye,
  LuLink, LuTrash2, LuSave, LuUser, LuPlus,
  LuHeading1, LuHeading2, LuBold, LuItalic, LuList, LuListOrdered,
  LuQuote, LuTable, LuUndo2, LuRedo2, LuPaperclip, LuFile, LuLoader, LuDownload,
} from "react-icons/lu";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";

/* --- Types ----------------------------------------------------------- */
export interface DrawerRow {
  id:              string;
  action:          string;
  intendedOutcome: string;
  status:          string;
  due:             string;
  accountable:     string;
  accountableId?:  number;
  linkTo:          string;
  actionId?:       string;
  note?:           string;
  pathwayTitle?:   string;
  pathwayDesc?:    string;
  category?:       Category;
  platform?:       Platform;
  additionalActions?: { id: string; action: string; intendedOutcome: string; category?: Category; platform?: Platform }[];
}

export type PerformanceTab = "numbers" | "creatives" | "experiments";

const PERFORMANCE_OPTIONS: { value: PerformanceTab; label: string }[] = [
  { value: "numbers",     label: "Numbers" },
  { value: "creatives",   label: "Creatives" },
  { value: "experiments", label: "Experiments" },
];

const CATEGORY_OPTIONS = ["Breakdowns", "Escalations", "Requests"] as const;
export type Category = typeof CATEGORY_OPTIONS[number];

const PLATFORM_OPTIONS = ["Meta", "Taboola"] as const;
export type Platform = typeof PLATFORM_OPTIONS[number];

/* --- Team Members ---------------------------------------------------- */
// We now fetch team members from the API instead of using a hardcoded list.
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
  value, onChange, disabled
}: { value: string; onChange: (name: string, id?: number) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

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

  useEffect(() => {
    if (users.length > 0) return;
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/api/v1/user-management/workspaces/${workspaceId}/users`, {
          params: { only_active: false, full_data: true },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setUsers(res.data.data.users || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, [workspaceId, token, users.length]);

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const filteredMembers = users
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (user: { id: number; name: string }) => {
    onChange(user.name, user.id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { if (!disabled) { setOpen(o => !o); setSearch(""); } }}
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs text-[#111928] dark:text-white hover:text-[#5750F1] dark:hover:text-[#7c78f3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                onClick={() => { onChange("", 0); setOpen(false); setSearch(""); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <LuUser size={13} />
                <span>Unassigned</span>
                {!value && <LuCheck size={12} className="text-[#5750F1] ml-auto shrink-0" />}
              </button>
            )}
            {filteredMembers.length > 0 ? filteredMembers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <div className="h-5 w-5 rounded-full bg-[#2563eb] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                  {initials(user.name)}
                </div>
                <span className="text-[#111928] dark:text-[#D1D5DB]">{user.name}</span>
                {value === user.name && <LuCheck size={12} className="text-[#5750F1] ml-auto shrink-0" />}
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
function RichEditor({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // Sync value from parent to contentEditable only when not focused
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

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
      {!disabled && (
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
      )}

      {/* Content area */}
      <div
        ref={editorRef}
        contentEditable={!disabled ? "true" : "false"}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={(e) => { syncFormats(); handleInput(); }}
        onMouseUp={syncFormats}
        onSelect={syncFormats}
        data-placeholder="Add more detail..."
        className={[
          "min-h-[100px] px-3 py-2 text-sm text-[#111928] dark:text-[#D1D5DB] outline-none",
          "focus:ring-0",
          disabled ? "bg-[#F9FAFB]/50 dark:bg-[#0a1018]/20 cursor-not-allowed opacity-60" : "",
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
  hideAddAnother,
  pathwayId,
}: {
  row:          DrawerRow | null;
  title?:       string;
  isPathway?:   boolean;
  onClose:      () => void;
  onSave:       (updated: DrawerRow) => Promise<any> | any;
  onDelete:     (id: string) => void;
  /** When provided, shows the Performance / Category / Platform dropdowns */
  performance?: PerformanceTab | null;
  hideAddAnother?: boolean;
  /** The pathway ID to attach files to */
  pathwayId?: string | null;
}) {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();
  const [draft, setDraft] = useState<DrawerRow | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checkInput, setCheckInput] = useState("");

  // Links, Watchers, Dependencies
  const [links, setLinks] = useState<string[]>([]);
  const [watchers, setWatchers] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);

  // Attachments — store both display info and actual File objects
  const [attachments, setAttachments] = useState<{ name: string; size: number; url?: string | null; key?: string | null; contentType?: string | null }[]>([]);
  // Files staged when no pathwayId yet (new pathway); uploaded after save returns the ID
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);

  // Performance / Category / Platform state
  const [perfTab, setPerfTab] = useState<PerformanceTab>(initialPerformance ?? "numbers");
  const [category, setCategory] = useState<Category>("Breakdowns");
  const [platform, setPlatform] = useState<Platform>("Meta");

  const [isSaving, setIsSaving] = useState(false);
  // Per-file upload progress tracking
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; error?: string }[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const isOpen = !!row;

  // Sync draft when row changes
  useEffect(() => {
    setDraft(row ? { ...row } : null);
    setChecklist([]);
    setCheckInput("");
    setLinks([]);
    setWatchers([]);
    setDependencies([]);
    setAttachments([]);
    setPendingFiles([]);
    setUploadingFiles([]);
    setIsViewAllOpen(false);
    // Reset perf dropdowns to the caller's default
    if (initialPerformance) setPerfTab(initialPerformance);
    // Use category/platform from the row if available, otherwise default
    const rowCategory = row?.category
      ? (CATEGORY_OPTIONS.find(opt => opt.toLowerCase() === (row.category as string).toLowerCase()) || "Breakdowns")
      : "Breakdowns";
    const rowPlatform = row?.platform
      ? (PLATFORM_OPTIONS.find(opt => opt.toLowerCase() === (row.platform as string).toLowerCase()) || "Meta")
      : "Meta";
    setCategory(rowCategory as Category);
    setPlatform(rowPlatform as Platform);
  }, [row]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;

    const fetchDetails = async () => {
      const hasNumericActionId = !isPathway && row?.id && /^\d+$/.test(row.id);
      const hasNumericPathwayId = pathwayId && /^\d+$/.test(pathwayId);
      
      if (hasNumericActionId || hasNumericPathwayId) {
        setIsLoadingDetails(true);
      }

      try {
        let pathwayData = null;
        let actionData = null;

        // 1. If editing an action (isPathway is false) and we have a numeric action ID
        if (!isPathway && row?.id && /^\d+$/.test(row.id)) {
          const actionRes = await api.get(`/api/v1/planner/pathways/actions/${row.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (actionRes.data?.success) {
            actionData = actionRes.data.data;
          }
        }

        // Determine pathway ID to fetch (either prop pathwayId or from actionData)
        const targetPathwayId = pathwayId || (actionData ? String(actionData.pathway_id) : null);

        // 2. Fetch pathway details
        if (targetPathwayId && /^\d+$/.test(targetPathwayId)) {
          const pathwayRes = await api.get(`/api/v1/planner/pathways/${targetPathwayId}`, {
            params: { workspace_id: workspaceId },
            headers: { Authorization: `Bearer ${token}` }
          });
          if (pathwayRes.data?.success) {
            pathwayData = pathwayRes.data.data;
          }
        }

        // 3. Map details to states
        if (pathwayData) {
          // Map attachments
          let parsedAttachments = [];
          if (pathwayData.attachments) {
            try {
              parsedAttachments = typeof pathwayData.attachments === "string" 
                ? JSON.parse(pathwayData.attachments) 
                : pathwayData.attachments;
            } catch (e) {
              console.error("Failed to parse attachments:", e);
            }
          }
          setAttachments((parsedAttachments || []).map((att: any) => ({
            name: att.filename || att.name || "File",
            size: att.size || 0,
            url: att.url || null,
            key: att.key || null,
            contentType: att.content_type || att.contentType || null
          })));

          // Map status for pathway or action
          const targetStatus = actionData 
            ? (actionData.status || "")
            : (isPathway ? (pathwayData.status || "") : (row?.status || ""));
          const mappedStatus = STATUS_OPTIONS.find(
            opt => opt.label.toLowerCase() === targetStatus.toLowerCase()
          )?.label || "Planned";

          const targetCategory = actionData ? actionData.category : (isPathway ? null : row?.category);
          const targetPlatform = actionData ? actionData.platform : (isPathway ? null : row?.platform);

          const mappedCategory = targetCategory 
            ? (CATEGORY_OPTIONS.find(opt => opt.toLowerCase() === (targetCategory as string).toLowerCase()) || "Breakdowns")
            : "Breakdowns";
          const mappedPlatform = targetPlatform
            ? (PLATFORM_OPTIONS.find(opt => opt.toLowerCase() === (targetPlatform as string).toLowerCase()) || "Meta")
            : "Meta";

          setCategory(mappedCategory as Category);
          setPlatform(mappedPlatform as Platform);

          setDraft(d => {
            if (!d) return null;
            if (isPathway) {
              const actions: any[] = pathwayData.actions || [];
              const targetAct = actions[0];

              const actCategory = targetAct?.category 
                ? (CATEGORY_OPTIONS.find(opt => opt.toLowerCase() === targetAct.category.toLowerCase()) || "Breakdowns")
                : "Breakdowns";
              const actPlatform = targetAct?.platform
                ? (PLATFORM_OPTIONS.find(opt => opt.toLowerCase() === targetAct.platform.toLowerCase()) || "Meta")
                : "Meta";

              // Pathway edit mode: map additional actions (actions after the first one)
              const mappedAdditional = actions.slice(1).map((a: any) => ({
                id: String(a.id),
                action: a.title,
                intendedOutcome: a.intended_outcome || "",
                category: CATEGORY_OPTIONS.find(opt => opt.toLowerCase() === (a.category || "").toLowerCase()) || "Breakdowns",
                platform: PLATFORM_OPTIONS.find(opt => opt.toLowerCase() === (a.platform || "").toLowerCase()) || "Meta"
              }));

              return {
                ...d,
                pathwayTitle: pathwayData.name,
                pathwayDesc: pathwayData.description,
                status: mappedStatus,
                due: pathwayData.due_date || "",
                accountable: pathwayData.accountable_name || "",
                accountableId: pathwayData.accountable_id || 0,
                // Primary action details (actions[0])
                actionId: targetAct ? String(targetAct.id) : undefined,
                action: targetAct?.title || "",
                intendedOutcome: targetAct?.intended_outcome || "",
                category: actCategory as Category,
                platform: actPlatform as Platform,
                note: pathwayData.note || "",
                additionalActions: mappedAdditional
              };
            } else {
              // Action edit mode
              return {
                ...d,
                status: mappedStatus,
                due: pathwayData.due_date || d.due || "",
                accountable: pathwayData.accountable_name || d.accountable || "",
                accountableId: pathwayData.accountable_id || d.accountableId || 0,
                action: actionData?.title || d.action || "",
                intendedOutcome: actionData?.intended_outcome || d.intendedOutcome || "",
                category: mappedCategory as Category,
                platform: mappedPlatform as Platform,
                note: pathwayData.note || "",
                actionId: actionData ? String(actionData.id) : d.actionId,
              };
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [isOpen, isPathway, pathwayId, row, workspaceId, token]);


  const addCheckItem = () => {
    if (!checkInput.trim()) return;
    setChecklist(c => [...c, checkInput.trim()]);
    setCheckInput("");
  };

  // ─── Core presigned-URL upload helper ──────────────────────────────────
  const uploadFilesToPathway = async (idToUse: string, files: File[]) => {
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    for (const file of files) {
      setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }]);
      try {
        // Step 1 — Initiate
        const initiateRes = await fetch(
          `${API_BASE}/api/v1/planner/pathways/${idToUse}/attachments/initiate?workspace_id=${workspaceId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              filename: file.name,
              size: file.size,
              content_type: file.type || "application/octet-stream",
            }),
          }
        );
        const initData = await initiateRes.json();
        if (!initData.success) throw new Error(initData.message || "Initiate failed");

        const { upload_type, object_key } = initData.data;
        let completedParts: { part_number: number; etag: string }[] | null = null;

        if (upload_type === "simple") {
          // Step 2a — Simple PUT directly to R2
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", initData.data.upload_url);
            xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.round((ev.loaded / ev.total) * 100);
                setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, progress: pct } : u));
              }
            };
            xhr.onload = () => xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`R2 upload failed (status ${xhr.status}). Check CORS config for this origin.`));
            xhr.onerror = () => reject(new Error(
              `R2 upload blocked — likely a CORS issue. Add ${window.location.origin} to the R2 CORS allowed origins.`
            ));
            xhr.send(file);
          });
        } else {
          // Step 2b — Multipart upload
          const parts: { part_number: number; url: string }[] = initData.data.parts;
          const partSize: number = initData.data.part_size;
          const done: { part_number: number; etag: string }[] = [];
          let totalUploaded = 0;
          for (const part of parts) {
            const start = (part.part_number - 1) * partSize;
            const end = Math.min(start + partSize, file.size);
            const blob = file.slice(start, end);
            const partRes = await fetch(part.url, { method: "PUT", body: blob });
            if (!partRes.ok) throw new Error(`Part ${part.part_number} failed: ${partRes.status}`);
            const etag = partRes.headers.get("ETag")?.replace(/"/g, "") || "";
            done.push({ part_number: part.part_number, etag });
            totalUploaded += (end - start);
            setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, progress: Math.round((totalUploaded / file.size) * 100) } : u));
          }
          completedParts = done;
        }

        // Step 3 — Complete
        const completeParams = new URLSearchParams({
          workspace_id: String(workspaceId),
          object_key,
          filename: file.name,
          size: String(file.size),
          content_type: file.type || "application/octet-stream",
          upload_type,
        });
        if (initData.data.upload_id) completeParams.set("upload_id", initData.data.upload_id);

        const completeRes = await fetch(
          `${API_BASE}/api/v1/planner/pathways/${idToUse}/attachments/complete?${completeParams}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ parts: completedParts }),
          }
        );
        const completeData = await completeRes.json();
        if (!completeData.success) throw new Error(completeData.message || "Complete failed");

        const att = completeData.data;
        setAttachments(prev => [...prev, {
          name: att.filename || file.name,
          size: att.size || file.size,
          url: att.url || null,
          key: att.key || null,
          contentType: att.content_type || file.type || null,
        }]);
        setUploadingFiles(prev => prev.filter(u => u.name !== file.name));

      } catch (err: any) {
        console.error("File upload failed:", err);
        setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, error: err.message || "Upload failed" } : u));
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    e.target.value = "";

    if (pathwayId) {
      // Existing pathway — upload immediately
      await uploadFilesToPathway(pathwayId, fileArr);
    } else {
      // New pathway — stage locally; will be uploaded after save creates the pathway
      setPendingFiles(prev => [...prev, ...fileArr]);
      setAttachments(prev => [
        ...prev,
        ...fileArr.map(f => ({ name: f.name, size: f.size, url: null, key: null, contentType: f.type || null })),
      ]);
    }
  };

  const handleRemoveAttachment = async (i: number) => {
    const removed = attachments[i];

    // If already uploaded (has a key) and we have a pathwayId, call the delete API
    if (removed?.key && pathwayId) {
      setDeletingIdx(i);
      try {
        await api.delete(
          `/api/v1/planner/pathways/${pathwayId}/attachments`,
          {
            params: { workspace_id: workspaceId, object_key: removed.key },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error("Failed to delete attachment:", err);
        setDeletingIdx(null);
        return; // Don't remove from UI if API failed
      } finally {
        setDeletingIdx(null);
      }
    }

    // Remove from local state (and pending queue if staged)
    setAttachments(prev => prev.filter((_, idx) => idx !== i));
    if (!removed?.url) {
      setPendingFiles(prev => prev.filter(f => f.name !== removed?.name));
    }
  };

  // ─── Blob-based download helper (via backend presigned URL) ─────────────
  const handleDownloadAttachment = async (i: number) => {
    const file = attachments[i];
    // Needs both a key (for the API) and a pathwayId
    if (!file?.key || !pathwayId) return;
    setDownloadingIdx(i);
    try {
      // Step 1 — get a short-lived presigned download URL from the backend
      const res = await api.get(
        `/api/v1/planner/pathways/${pathwayId}/attachments/download`,
        {
          params: { workspace_id: workspaceId, object_key: file.key },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const presignedUrl: string = res.data?.data?.url;
      if (!presignedUrl) throw new Error("No download URL returned");

      // Step 2 — fetch the file bytes and build a Blob
      const response = await fetch(presignedUrl);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const blob = await response.blob();

      // Step 3 — trigger browser save-as dialog
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingIdx(null);
    }
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
          {isLoadingDetails ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center py-20">
              <LuLoader className="animate-spin text-[#5750F1]" size={32} />
              <p className="mt-2 text-xs text-[#9CA3AF]">Loading action details...</p>
            </div>
          ) : (
            <>
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

              {initialPerformance != null && (
                <div className="flex flex-wrap items-center gap-3 mt-3 mb-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Category</span>
                    <SimpleDropdown<Category>
                      label="Category"
                      value={add.category || "Breakdowns"}
                      options={CATEGORY_OPTIONS}
                      onChange={val => setDraft(d => {
                        if (!d) return d;
                        const newActs = [...(d.additionalActions || [])];
                        newActs[idx].category = val;
                        return { ...d, additionalActions: newActs };
                      })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide">Platform</span>
                    <SimpleDropdown<Platform>
                      label="Platform"
                      value={add.platform || "Meta"}
                      options={PLATFORM_OPTIONS}
                      onChange={val => setDraft(d => {
                        if (!d) return d;
                        const newActs = [...(d.additionalActions || [])];
                        newActs[idx].platform = val;
                        return { ...d, additionalActions: newActs };
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {!(hideAddAnother || (isPathway && pathwayId && /^\d+$/.test(pathwayId))) && (
            <button
              onClick={() => setDraft(d => d ? { ...d, additionalActions: [...(d.additionalActions || []), { id: crypto.randomUUID(), action: "", intendedOutcome: "", category: "Breakdowns", platform: "Meta" }] } : d)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#5750F1] hover:text-[#5750F1]/80 transition-colors mb-6"
            >
              <LuPlus size={14} />
              Add another action
            </button>
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
                disabled={!isPathway}
                onChange={e => setDraft(d => d ? { ...d, due: e.target.value } : d)}
                className="text-xs text-[#111928] dark:text-white bg-transparent border-none outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </SectionRow>

            <SectionRow label="👤 Accountable">
              <AccountableDropdown
                value={draft.accountable}
                disabled={!isPathway}
                onChange={(name, id) => setDraft(d => d ? { ...d, accountable: name, accountableId: id } : d)}
              />
            </SectionRow>

            
          </div>

          {/* Rich text editor */}
          <RichEditor 
            value={draft.note || ""} 
            disabled={!isPathway}
            onChange={val => setDraft(d => d ? { ...d, note: val } : d)} 
          />

         

          {/* Attachments */}
          <div className="border-t border-[#E6EBF1] dark:border-[#1F2A37] pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#111928] dark:text-white">
                <LuPaperclip size={13} /> Attachments
              </span>
              <div className="flex items-center gap-3">
                {attachments.length > 0 && (
                  <button
                    onClick={() => setIsViewAllOpen(true)}
                    className="text-[11px] text-[#5750F1] hover:opacity-80"
                  >
                    View All
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#5750F1] hover:opacity-80"
                >
                  Upload
                </button>
              </div>
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
                    {file.url && (file.contentType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) ? (
                      <div className="h-5 w-5 rounded border border-[#E6EBF1] dark:border-[#1F2A37] overflow-hidden shrink-0">
                        <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <LuFile size={12} className="text-[#5750F1] shrink-0" />
                    )}
                    <span className="text-[11px] text-[#111928] dark:text-[#D1D5DB] flex-1 truncate">
                      {file.url ? (
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:text-[#5750F1] dark:hover:text-[#7c78f3] hover:underline"
                        >
                          {file.name}
                        </a>
                      ) : (
                        file.name
                      )}
                    </span>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0">{formatFileSize(file.size)}</span>
                    {/* Download button — via backend presigned URL */}
                    {file.key ? (
                      <button
                        onClick={() => handleDownloadAttachment(i)}
                        disabled={downloadingIdx === i}
                        className="text-[#9CA3AF] hover:text-[#5750F1] transition-colors shrink-0 p-1 disabled:opacity-60 disabled:cursor-wait"
                        title="Download file"
                      >
                        {downloadingIdx === i
                          ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                          : <LuDownload size={11} />}
                      </button>
                    ) : (
                      <span className="text-[#D1D5DB] dark:text-[#374151] shrink-0 p-1 cursor-not-allowed" title="Upload in progress">
                        <LuDownload size={11} />
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveAttachment(i)}
                      disabled={deletingIdx === i}
                      className="text-[#9CA3AF] hover:text-red-500 transition-colors disabled:opacity-60 disabled:cursor-wait shrink-0 p-1"
                      title="Delete attachment"
                    >
                      {deletingIdx === i
                        ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                        : <LuTrash2 size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#9CA3AF]">No attachments yet</p>
            )}
          </div>
            </>
          )}
        </div>

        {/* Per-file upload progress */}
        {uploadingFiles.length > 0 && (
          <div className="px-5 py-2 border-t border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] flex flex-col gap-2">
            {uploadingFiles.map((uf, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-0.5">
                  <span className="truncate max-w-[200px]" title={uf.name}>{uf.name}</span>
                  {uf.error
                    ? <span className="text-red-400 text-[10px]">{uf.error}</span>
                    : <span>{uf.progress}%</span>
                  }
                </div>
                <div className="w-full bg-[#E6EBF1] dark:bg-[#1F2A37] h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 rounded-full ${uf.error ? "bg-red-400" : "bg-[#5750F1]"}`}
                    style={{ width: `${uf.error ? 100 : uf.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520]">
          <button
            disabled={isSaving || isLoadingDetails}
            onClick={async () => {
              setIsSaving(true);
              try {
                // Save/create the pathway; onSave returns the new pathway ID for new pathways
                const savedPathwayId = await onSave({ ...draft, category, platform });

                // Upload any staged files (pending when there was no pathwayId at file-select time)
                const idForUpload = savedPathwayId || pathwayId;
                if (idForUpload && pendingFiles.length > 0) {
                  await uploadFilesToPathway(String(idForUpload), pendingFiles);
                  setPendingFiles([]);
                }

                onClose();
              } catch (err) {
                console.error("Failed to save:", err);
              } finally {
                setIsSaving(false);
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#5750F1] text-white px-5 py-2 text-xs font-semibold hover:bg-[#4742d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : (
              <>
                <LuSave size={13} />
                Save changes
              </>
            )}
          </button>
          
          <button
            disabled={isSaving}
            onClick={() => { onDelete(draft.id); onClose(); }}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 px-4 py-2 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuTrash2 size={13} />
            Delete
          </button>
        </div>
      </div>

      {isViewAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsViewAllOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg rounded-xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-2xl p-5 z-10 flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EBF1] dark:border-[#1F2A37] mb-4">
              <div className="flex items-center gap-2">
                <LuPaperclip size={15} className="text-[#5750F1]" />
                <h3 className="text-sm font-semibold text-[#111928] dark:text-white">
                  All Attachments ({attachments.length})
                </h3>
              </div>
              <button
                onClick={() => setIsViewAllOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors p-1"
              >
                <LuX size={16} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
              {attachments.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#9CA3AF]">
                  No attachments found.
                </div>
              ) : (
                attachments.map((file, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 rounded-lg border border-[#E6EBF1] dark:border-[#1F2A37] bg-[#F9FAFB] dark:bg-[#0a1018] px-3.5 py-2.5 hover:border-[#5750F1]/40 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5750F1]/10 border border-[#5750F1]/20 overflow-hidden">
                      {file.url && (file.contentType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) ? (
                        <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                      ) : (
                        <LuFile size={14} className="text-[#5750F1]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#111928] dark:text-white truncate" title={file.name}>
                        {file.url ? (
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-[#5750F1] dark:hover:text-[#7c78f3] hover:underline"
                          >
                            {file.name}
                          </a>
                        ) : (
                          file.name
                        )}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#9CA3AF] hover:text-[#5750F1] transition-colors p-1.5 rounded-lg hover:bg-[#5750F1]/10"
                          title="View file"
                        >
                          <LuEye size={13} />
                        </a>
                      )}
                      <button
                        onClick={() => handleRemoveAttachment(i)}
                        className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                        title="Remove attachment"
                      >
                        <LuTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-[#E6EBF1] dark:border-[#1F2A37] mt-4">
              <button
                onClick={() => setIsViewAllOpen(false)}
                className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-4 py-2 text-xs font-semibold text-[#111928] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a2332] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
