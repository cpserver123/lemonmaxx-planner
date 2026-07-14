"use client";

import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuChevronDown, LuStar, LuX, LuLoader } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import api from "@/app/utils/axios";
import { toast } from "react-toastify";
import type { RootState } from "@/store";
import {
  setWorkspaceList,
  setSelectedWorkspaceId,
  setCreateStoreWorkspace,
  type Workspace,
} from "@/store/slices/workspace.slice";

/* --- helpers --------------------------------------------------------- */
const isFav = (w: Workspace) => {
  const raw = w?.is_favorite;
  return raw === true || raw === "true" || raw === 1 || raw === "1";
};

/* ===================================================================== */
export function WorkspaceDropdown() {
  const dispatch = useDispatch();
  const { token, user } = useAuth();
  const { list: workspaces, selectedId } = useSelector(
    (s: RootState) => s.workspace
  );

  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favUpdating, setFavUpdating] = useState<string | number | null>(null);

  // create-workspace form
  const [wsName, setWsName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [tzSearch, setTzSearch] = useState("");
  const [tzList, setTzList] = useState<string[]>([]);
  const [tzLoading, setTzLoading] = useState(false);
  const [showTzDrop, setShowTzDrop] = useState(false);
  const [mediaBuyerCode, setMediaBuyerCode] = useState(false);
  const [creating, setCreating] = useState(false);

  const canCreate = user?.role === "superadmin";
  const dropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const tzRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  const selected = workspaces.find((w) => w.id === selectedId);
  const fallback = workspaces.find((w) => isFav(w)) ?? workspaces[0];
  const displayName = selected?.name ?? fallback?.name ?? "";

  const sorted = [...workspaces].sort((a, b) => {
    const af = isFav(a);
    const bf = isFav(b);
    if (af === bf) return 0;
    return af ? -1 : 1;
  });

  const filteredTz = tzList.filter((t) =>
    t.toLowerCase().includes(tzSearch.toLowerCase())
  );

  /* --- close-on-outside ------------------------------------------------ */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node))
        setModal(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tzRef.current && !tzRef.current.contains(e.target as Node))
        setShowTzDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!modal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]);

  /* --- fetch workspaces on mount --------------------------------------- */
  useEffect(() => {
    if (!token || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchWorkspaces();
  }, [token]);

  /* --- API calls ------------------------------------------------------- */
  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/workspace/workspace-list", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = res.data;
      if (result.success && Array.isArray(result.data?.workspaces)) {
        const ws: Workspace[] = result.data.workspaces;
        dispatch(setWorkspaceList(ws));
        if (ws.length > 0) {
          const fav = ws.find((w) => isFav(w));
          if (fav?.id != null) {
            dispatch(setSelectedWorkspaceId(fav.id));
          } else if (!selectedId || !ws.some((w) => w.id === selectedId)) {
            dispatch(setSelectedWorkspaceId(ws[0].id));
          }
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to load workspaces";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimezones = async () => {
    if (tzList.length > 0) return;
    setTzLoading(true);
    try {
      const res = await api.get("/api/v1/misc/timezones", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (
        res.data.success &&
        Array.isArray(res.data.data?.timezones)
      ) {
        setTzList(res.data.data.timezones);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load timezones");
    } finally {
      setTzLoading(false);
    }
  };

  const toggleFav = async (e: React.MouseEvent, item: Workspace) => {
    e.stopPropagation();
    if (!token || !item?.id || favUpdating != null) return;
    const next = !isFav(item);
    setFavUpdating(item.id);
    try {
      const res = await api.patch(
        `/api/v1/workspace/${item.id}`,
        { is_favorite: String(next) },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.data?.success) {
        toast.error(res.data?.message || "Failed to update favorite");
        return;
      }
      const updated = workspaces.map((w) => {
        if (w.id === item.id) return { ...w, is_favorite: next };
        if (next && isFav(w)) return { ...w, is_favorite: false };
        return w;
      });
      dispatch(setWorkspaceList(updated));
      if (next) dispatch(setSelectedWorkspaceId(item.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to update favorite");
    } finally {
      setFavUpdating(null);
    }
  };

  const createWorkspace = async () => {
    if (!wsName.trim() || !timezone) {
      toast.error("Please fill in both Workspace Name and Timezone");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post(
        "/api/v1/workspace",
        {
          name: wsName,
          default_timezone: timezone,
          media_buyer_code_wise: mediaBuyerCode,
        },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.success) {
        dispatch(setCreateStoreWorkspace(res.data.data));
        dispatch(setSelectedWorkspaceId(res.data.data.id));
        toast.success("Workspace created");
        closeModal();
        setOpen(false);
      } else {
        toast.error(res.data.message || "Failed to create workspace");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create workspace"
      );
    } finally {
      setCreating(false);
    }
  };

  /* --- modal helpers --------------------------------------------------- */
  const openModal = () => {
    if (!canCreate) return;
    setModal(true);
    setWsName("");
    setTimezone("");
    setTzSearch("");
    setMediaBuyerCode(false);
    fetchTimezones();
  };

  const closeModal = () => {
    setModal(false);
    setWsName("");
    setTimezone("");
    setTzSearch("");
    setMediaBuyerCode(false);
  };

  /* --- render ---------------------------------------------------------- */
  return (
    <>
      {/* Trigger */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-2 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/50 dark:hover:border-[#5750F1]/50 transition-colors max-w-[180px]"
        >
          <span className="truncate">
            {loading ? "Loading…" : displayName || "No Workspace"}
          </span>
          <LuChevronDown
            size={13}
            className={`shrink-0 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-xl overflow-hidden">
            {/* Workspace list */}
            <div className="max-h-60 overflow-y-auto py-1">
              {sorted.length === 0 && (
                <p className="px-4 py-3 text-xs text-[#9CA3AF] text-center">
                  No workspaces found
                </p>
              )}
              {sorted.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => {
                    dispatch(setSelectedWorkspaceId(ws.id));
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between gap-2 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] ${
                    selectedId === ws.id
                      ? "text-[#5750F1] font-semibold"
                      : "text-[#111928] dark:text-white"
                  }`}
                >
                  <span className="text-xs truncate min-w-0">{ws.name}</span>
                  <button
                    onClick={(e) => toggleFav(e, ws)}
                    disabled={favUpdating === ws.id}
                    className={`shrink-0 p-0.5 rounded transition-colors ${
                      isFav(ws)
                        ? "text-yellow-400"
                        : "text-[#D1D5DB] dark:text-[#4B5563] hover:text-yellow-400"
                    }`}
                  >
                    <LuStar
                      size={14}
                      fill={isFav(ws) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Create workspace — superadmin only */}
            {canCreate && (
              <>
                <div className="border-t border-[#E6EBF1] dark:border-[#374151]" />
                <button
                  onClick={openModal}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-[#5750F1] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                >
                  + Create Workspace
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Create Workspace Modal ─────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="w-full max-w-md mx-4 rounded-2xl border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6EBF1] dark:border-[#374151]">
              <h3 className="text-sm font-semibold text-[#111928] dark:text-white">
                Create Workspace
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-md text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                <LuX size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1.5">
                  Workspace Name
                </label>
                <input
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Enter workspace name..."
                  className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#5750F1] transition-colors"
                />
              </div>

              {/* Timezone (searchable) */}
              <div ref={tzRef}>
                <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <input
                    value={timezone || tzSearch}
                    onChange={(e) => {
                      setTzSearch(e.target.value);
                      setTimezone("");
                      setShowTzDrop(true);
                    }}
                    onFocus={() => setShowTzDrop(true)}
                    placeholder={tzLoading ? "Loading…" : "Search timezone…"}
                    disabled={tzLoading}
                    className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#5750F1] transition-colors"
                  />
                  {timezone && (
                    <button
                      onClick={() => {
                        setTimezone("");
                        setTzSearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white"
                    >
                      <LuX size={12} />
                    </button>
                  )}
                  {showTzDrop && !tzLoading && (
                    <div className="absolute left-0 top-full mt-1 z-10 w-full max-h-48 overflow-y-auto rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-lg">
                      {filteredTz.length > 0 ? (
                        filteredTz.map((tz) => (
                          <button
                            key={tz}
                            onClick={() => {
                              setTimezone(tz);
                              setTzSearch("");
                              setShowTzDrop(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-[#111928] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
                          >
                            {tz}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">
                          No timezones found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Media buyer code toggle */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setMediaBuyerCode((p) => !p)}
                  className={`mt-0.5 shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    mediaBuyerCode
                      ? "bg-[#5750F1]"
                      : "bg-[#D1D5DB] dark:bg-[#4B5563]"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                      mediaBuyerCode ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-snug">
                  By clicking this, you will see campaign data and media buyer
                  performance based on the Media Buyer Code you configured in
                  your tracker (RedTrack/Voluum).
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E6EBF1] dark:border-[#374151]">
              <button
                onClick={closeModal}
                className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#111928] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createWorkspace}
                disabled={creating}
                className="rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-medium text-white hover:bg-[#4742d4] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {creating && <LuLoader size={12} className="animate-spin" />}
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
