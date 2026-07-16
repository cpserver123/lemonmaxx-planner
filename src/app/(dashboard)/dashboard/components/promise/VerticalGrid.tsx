"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import api from "@/app/utils/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import type { VerticalData } from "./VerticalCard";
import PromiseFilters from "./PromiseFilters";
import { LuPlus, LuX, LuChevronDown, LuTriangleAlert, LuPencil, LuSearch, LuLoader } from "react-icons/lu";

/* --- Create Vertical Modal --------------------------------------------- */
export function CreateVerticalModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [verticalSearch, setVerticalSearch] = useState("");
  const [verticalOpen, setVerticalOpen] = useState(false);
  const [verticals, setVerticals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const filteredVerticals = verticals.filter(v => v.toLowerCase().includes(verticalSearch.toLowerCase()));

  const fetchVerticals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/planner/verticals-offer-list-from-redtrack", {
        params: { workspace_id: workspaceId, type: "vertical" },
        headers: { Authorization: `Bearer ${token}` },
      });
      setVerticals(res.data?.data?.verticals ?? []);
    } catch {
      setError("Failed to load verticals.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => {
    if (open) {
      setName("");
      setVerticalSearch("");
      setVerticalOpen(false);
      fetchVerticals();
    }
  }, [open, fetchVerticals]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setVerticalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async () => {
    const v = name.trim();
    if (!v) return;

    setSaving(true);
    setSaveError(null);
    try {
      await api.post("/api/v1/planner/verticals", {
        workspace_id: workspaceId,
        name: v
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Vertical created successfully");
      onSave(v);
      onClose();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || "Failed to save vertical");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[360px] rounded-2xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-2xl p-6 transition-all duration-200 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#111928] dark:text-white">Create Vertical</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuX size={15} /></button>
        </div>
        <p className="text-[11px] text-[#9CA3AF] mb-4">Enter a name for the new vertical.</p>

        {/* Searchable vertical dropdown */}
        <div className="relative mb-4" ref={dropRef}>
          <div
            onClick={() => !loading && setVerticalOpen(p => !p)}
            className="w-full flex items-center justify-between rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm cursor-pointer select-none transition-colors focus-within:border-[#5750F1]"
          >
            <span className={name ? "text-[#111928] dark:text-white" : "text-[#9CA3AF]"}>
              {loading ? "Loading..." : (name || "Select a vertical...")}
            </span>
            {loading
              ? <LuLoader size={14} className="text-[#9CA3AF] animate-spin" />
              : <LuChevronDown size={14} className={`text-[#9CA3AF] transition-transform ${verticalOpen ? "rotate-180" : ""}`} />}
          </div>
          {verticalOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#374151]">
                <LuSearch size={13} className="text-[#9CA3AF] shrink-0" />
                <input
                  autoFocus
                  value={verticalSearch}
                  onChange={e => setVerticalSearch(e.target.value)}
                  placeholder="Search verticals..."
                  className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {error ? (
                  <div className="px-3 py-2 text-center">
                    <p className="text-xs text-red-400 mb-1">{error}</p>
                    <button onClick={fetchVerticals} className="text-xs text-[#5750F1] underline">Retry</button>
                  </div>
                ) : filteredVerticals.length > 0 ? filteredVerticals.map(v => (
                  <button
                    key={v}
                    onClick={() => { setName(v); setVerticalOpen(false); setVerticalSearch(""); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] ${
                      name === v ? "text-[#5750F1] font-medium" : "text-[#111928] dark:text-white"
                    }`}
                  >
                    {v}
                  </button>
                )) : (
                  <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No results</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {saveError && <span className="text-[11px] text-red-400 mr-2">{saveError}</span>}
          <button onClick={onClose} disabled={saving} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors disabled:opacity-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex items-center gap-2 rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <LuLoader size={14} className="animate-spin" /> Saving...
              </>
            ) : "Save Vertical"}
          </button>
        </div>
      </div>
    </>
  );
}

/* --- Create Offer Modal ------------------------------------------------- */
export function CreateOfferModal({
  open,
  onClose,
  onSave,
  verticals: verticalsProp,
  initialOfferName = "",
}: {
  open: boolean;
  onClose: () => void;
  onSave: (offerName: string, verticalName: string) => void;
  verticals: string[];
  initialOfferName?: string;
}) {
  const workspaceId = useSelector((state: RootState) => state.workspace.selectedId ?? 1);
  const { token } = useAuth();

  const [offerName, setOfferName] = useState("");
  const [selectedVertical, setSelectedVertical] = useState("");
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [offersOpen, setOffersOpen] = useState(false);
  const [offersSearch, setOffersSearch] = useState("");
  const [verticalOpen, setVerticalOpen] = useState(false);
  const [verticalSearch, setVerticalSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const offersDropRef = useRef<HTMLDivElement>(null);
  const verticalDropRef = useRef<HTMLDivElement>(null);

  // API-fetched offers
  const [apiOffers, setApiOffers] = useState<{ id: string; title: string }[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    setOffersLoading(true);
    setOffersError(null);
    try {
      const res = await api.get("/api/v1/planner/verticals-offer-list-from-redtrack", {
        params: { workspace_id: workspaceId, type: "offer" },
        headers: { Authorization: `Bearer ${token}` },
      });
      setApiOffers(res.data?.data?.offers ?? []);
    } catch {
      setOffersError("Failed to load offers.");
    } finally {
      setOffersLoading(false);
    }
  }, [workspaceId, token]);

  // API-fetched verticals
  const [apiVerticals, setApiVerticals] = useState<{ id: number; name: string }[]>([]);
  const [verticalsLoading, setVerticalsLoading] = useState(false);
  const [verticalsError, setVerticalsError] = useState<string | null>(null);

  const fetchApiVerticals = useCallback(async () => {
    setVerticalsLoading(true);
    setVerticalsError(null);
    try {
      const res = await api.get("/api/v1/planner/verticals", {
        params: { workspace_id: workspaceId, with_own_offers: false },
        headers: { Authorization: `Bearer ${token}` },
      });
      setApiVerticals(res.data?.data?.verticals ?? []);
    } catch {
      setVerticalsError("Failed to load verticals.");
    } finally {
      setVerticalsLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => {
    if (open) {
      setOfferName(initialOfferName);
      setSelectedOffers([]);
      setOffersOpen(false);
      setOffersSearch("");
      setVerticalOpen(false);
      setVerticalSearch("");
      setSelectedVertical("");
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchOffers();
      fetchApiVerticals();
    }
  }, [open, initialOfferName, fetchOffers, fetchApiVerticals]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (offersDropRef.current && !offersDropRef.current.contains(e.target as Node)) setOffersOpen(false);
      if (verticalDropRef.current && !verticalDropRef.current.contains(e.target as Node)) setVerticalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredOffers    = apiOffers.filter(o => o.title.toLowerCase().includes(offersSearch.toLowerCase()));
  const filteredVerticals = apiVerticals.filter(v => v.name.toLowerCase().includes(verticalSearch.toLowerCase()));

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedOfferName = offerName.trim();
    if (!trimmedOfferName || !selectedVertical) return;

    // Map selected offer titles back to their IDs
    const offerIds = selectedOffers
      .map(title => apiOffers.find(o => o.title === title)?.id)
      .filter(Boolean);

    // Find the ID of the selected vertical
    const verticalId = apiVerticals.find(v => v.name === selectedVertical)?.id;

    if (!verticalId) {
      setSaveError("Invalid vertical selected");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const res = await api.post("/api/v1/planner/own-offers", {
        workspace_id: workspaceId,
        name: trimmedOfferName,
        offer_ids: offerIds,
        vertical_id: verticalId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data?.message || "Own offer created successfully");
      onSave(trimmedOfferName, selectedVertical);
      onClose();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || "Failed to save offer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <div className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[380px] rounded-2xl border border-[#E6EBF1] dark:border-[#1F2A37] bg-white dark:bg-[#0d1520] shadow-2xl p-6 transition-all duration-200 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#111928] dark:text-white">Create Offer</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111928] dark:hover:text-white transition-colors"><LuX size={15} /></button>
        </div>
        <p className="text-[11px] text-[#9CA3AF] mb-4">Fill in the details for the new offer.</p>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1.5">Offer Name <span className="text-[#5750F1]">*</span></label>
          <input
            ref={inputRef}
            value={offerName}
            onChange={e => setOfferName(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
            placeholder="e.g. Bruno VSL"
            className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#5750F1] transition-colors"
          />
        </div>

        {/* Offers dropdown */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1.5">Offers</label>
          <div className="relative" ref={offersDropRef}>
            <div
              onClick={() => !offersLoading && setOffersOpen(!offersOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm text-[#111928] dark:text-white outline-none focus:border-[#5750F1] transition-colors cursor-pointer"
            >
              <span className={`truncate ${selectedOffers.length ? "" : "text-[#9CA3AF]"}`}>
                {offersLoading ? "Loading..." : (selectedOffers.length ? selectedOffers.join(", ") : "Select offers...")}
              </span>
              {offersLoading
                ? <LuLoader size={13} className="text-[#9CA3AF] shrink-0 ml-2 animate-spin" />
                : <LuChevronDown size={13} className={`text-[#9CA3AF] shrink-0 ml-2 transition-transform ${offersOpen ? "rotate-180" : ""}`} />}
            </div>
            {offersOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#374151]">
                  <LuSearch size={13} className="text-[#9CA3AF] shrink-0" />
                  <input
                    autoFocus
                    value={offersSearch}
                    onChange={e => setOffersSearch(e.target.value)}
                    placeholder="Search offers..."
                    className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {offersError ? (
                    <div className="px-3 py-2 text-center">
                      <p className="text-xs text-red-400 mb-1">{offersError}</p>
                      <button onClick={fetchOffers} className="text-xs text-[#5750F1] underline">Retry</button>
                    </div>
                  ) : filteredOffers.length > 0 ? filteredOffers.map(o => (
                    <label key={o.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]">
                      <input
                        type="checkbox"
                        checked={selectedOffers.includes(o.title)}
                        onChange={e => {
                          if (e.target.checked) setSelectedOffers([...selectedOffers, o.title]);
                          else setSelectedOffers(selectedOffers.filter(x => x !== o.title));
                        }}
                        className="rounded border-[#D1D5DB] dark:border-[#374151] text-[#5750F1] focus:ring-[#5750F1]"
                      />
                      <span className="text-sm text-[#111928] dark:text-white truncate">{o.title}</span>
                    </label>
                  )) : (
                    <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No results</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1.5">Vertical <span className="text-[#5750F1]">*</span></label>
          <div className="relative" ref={verticalDropRef}>
            <div
              onClick={() => !verticalsLoading && setVerticalOpen(p => !p)}
              className="w-full flex items-center justify-between rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm cursor-pointer select-none transition-colors"
            >
              <span className={selectedVertical ? "text-[#111928] dark:text-white" : "text-[#9CA3AF]"}>
                {verticalsLoading ? "Loading..." : (selectedVertical || "Select vertical...")}
              </span>
              {verticalsLoading
                ? <LuLoader size={13} className="text-[#9CA3AF] pointer-events-none animate-spin" />
                : <LuChevronDown size={13} className={`text-[#9CA3AF] pointer-events-none transition-transform ${verticalOpen ? "rotate-180" : ""}`} />}
            </div>
            {verticalOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E6EBF1] dark:border-[#374151]">
                  <LuSearch size={13} className="text-[#9CA3AF] shrink-0" />
                  <input
                    autoFocus
                    value={verticalSearch}
                    onChange={e => setVerticalSearch(e.target.value)}
                    placeholder="Search verticals..."
                    className="flex-1 bg-transparent text-xs text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {verticalsError ? (
                    <div className="px-3 py-2 text-center">
                      <p className="text-xs text-red-400 mb-1">{verticalsError}</p>
                      <button onClick={fetchApiVerticals} className="text-xs text-[#5750F1] underline">Retry</button>
                    </div>
                  ) : filteredVerticals.length > 0 ? filteredVerticals.map(v => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVertical(v.name); setVerticalOpen(false); setVerticalSearch(""); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] ${
                        selectedVertical === v.name ? "text-[#5750F1] font-medium" : "text-[#111928] dark:text-white"
                      }`}
                    >
                      {v.name}
                    </button>
                  )) : (
                    <p className="px-3 py-2 text-xs text-[#9CA3AF] text-center">No results</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          {saveError && <span className="text-[11px] text-red-400 mr-2">{saveError}</span>}
          <button onClick={onClose} disabled={saving} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors disabled:opacity-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!offerName.trim() || !selectedVertical || saving}
            className="flex items-center gap-2 rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <LuLoader size={14} className="animate-spin" /> Saving...
              </>
            ) : "Save Offer"}
          </button>
        </div>
      </div>
    </>
  );
}

/* --- Tree Node ---------------------------------------------------------- */
/** SVG connector lines for the tree */
function TreeConnector({ offerCount }: { offerCount: number }) {
  if (offerCount === 0) return null;
  return (
    <div className="flex flex-col items-center">
      {/* vertical stem from root */}
      <div className="w-px h-6 bg-[#374151]" />
    </div>
  );
}

function VerticalTree({
  vertical,
  onOfferClick,
  onEditOffer,
}: {
  vertical: VerticalData;
  onOfferClick: (verticalId: string) => void;
  onEditOffer: (offerName: string, verticalName: string) => void;
}) {
  const offers = vertical.offers ?? [];

  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

  // Totals for root
  const totalPromise    = offers.reduce((s, o) => s + (o.promise    ?? 0), 0);
  const totalNetPromise = offers.reduce((s, o) => s + (o.netPromise ?? 0), 0);
  const totalActuals    = offers.reduce((s, o) => s + (o.actuals    ?? 0), 0);

  return (
    <div className="flex flex-col items-center">
      {/* Root node */}
      <div className="flex flex-col items-center rounded-xl border-2 border-[#2563eb]/40 dark:border-[#2563eb]/50 bg-[#2563eb]/5 dark:bg-[#2563eb]/10 shadow-sm overflow-hidden min-w-[140px] max-w-[200px]">
        {/* Main row */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 w-full">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2563eb]/15 border border-[#2563eb]/20">
            <span className="text-xs">💰</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#111928] dark:text-white truncate">{vertical.name}</span>
              {vertical.hasWarning && <LuTriangleAlert size={10} className="text-[#FBBF24] shrink-0" />}
            </div>
          </div>
        </div>

        {/* Always-visible details */}
        <div className="w-full px-4 pb-2.5 pt-0 border-t border-[#2563eb]/20">
          <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-1.5">
            Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(totalPromise)}</span>
          </p>
          <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
            Net Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(totalNetPromise)}</span>
          </p>
          <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
            Actual Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(vertical.actuals ?? totalActuals)}</span>
          </p>
        </div>
      </div>

      {offers.length > 0 && (
        <>
          {/* Vertical stem down from root */}
          <div className="w-px h-5 bg-[#374151]" />

          {/* Horizontal bar */}
          <div className="relative flex items-start" style={{ width: `${Math.max(offers.length * 140, 140)}px` }}>
            {/* Top horizontal line spanning all offers */}
            {offers.length > 1 && (
              <div
                className="absolute top-0 bg-[#374151]"
                style={{
                  height: "1px",
                  left: `${(100 / offers.length) / 2}%`,
                  right: `${(100 / offers.length) / 2}%`,
                }}
              />
            )}

            {/* Each offer column */}
            {offers.map(offer => {
              return (
                <div key={offer.id} className="flex flex-col items-center flex-1">
                  {/* Vertical stem down to offer node */}
                  <div className="w-px h-5 bg-[#374151]" />

                  {/* Offer node */}
                  <div className={`group rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] shadow-sm overflow-hidden transition-all duration-200 min-w-[110px]`}>
                    {/* Main row */}
                    <div className="flex items-center gap-1 px-2.5 py-1.5">
                      <button
                        onClick={() => onOfferClick("blood-sugar")}
                        className="flex-1 text-xs font-medium text-[#111928] dark:text-white hover:text-[#2563eb] dark:hover:text-[#60a5fa] transition-colors text-left truncate"
                      >
                        {offer.name}
                      </button>
                      <span className="text-[#9CA3AF] text-xs shrink-0 pointer-events-none">›</span>
                      {/* Edit button */}
                      <button
                        onClick={e => { e.stopPropagation(); onEditOffer(offer.name, vertical.name); }}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#E6EBF1] dark:border-[#374151] text-[#6B7280] hover:border-[#2563eb]/50 hover:text-[#2563eb] transition-colors"
                        title="Edit offer"
                      >
                        <LuPencil size={8} />
                      </button>
                    </div>

                    {/* Always-visible details */}
                    <div className="px-2.5 pb-2 border-t border-[#E6EBF1] dark:border-[#374151] pt-1.5">
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                        Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(offer.promise ?? 0)}</span>
                      </p>
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                        Net Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(offer.netPromise ?? 0)}</span>
                      </p>
                      <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                        Actual Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(offer.actuals ?? 0)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* --- Component --------------------------------------------------------- */
export default function VerticalGrid({
  verticals,
  onSelect,
}: {
  verticals: VerticalData[];
  onSelect?: (id: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<"org-promises">("org-promises");

  // Locally created verticals (full VerticalData objects with their offers)
  const [localVerticals, setLocalVerticals] = useState<VerticalData[]>([]);

  // Edit offer modal state
  const [editOfferName, setEditOfferName] = useState("");
  const [editOfferVertical, setEditOfferVertical] = useState("");
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);

  const handleEditOffer = (offerName: string, verticalName: string) => {
    setEditOfferName(offerName);
    setEditOfferVertical(verticalName);
    setShowEditOfferModal(true);
  };

  /** Renames an existing offer in place (does NOT create a new one). */
  function handleEditOfferSave(newOfferName: string, _verticalName: string) {
    const originalName = editOfferName;
    const renameInOffers = (offers: VerticalData["offers"]) =>
      (offers ?? []).map(o => o.name === originalName ? { ...o, name: newOfferName } : o);

    // Try to update in localVerticals first
    const inLocal = localVerticals.some(v => v.name === editOfferVertical);
    if (inLocal) {
      setLocalVerticals(prev =>
        prev.map(v =>
          v.name === editOfferVertical ? { ...v, offers: renameInOffers(v.offers) } : v
        )
      );
    } else {
      const base = verticals.find(v => v.name === editOfferVertical);
      if (base) {
        const existing = localVerticals.find(v => v.id === base.id);
        if (existing) {
          setLocalVerticals(prev =>
            prev.map(v =>
              v.id === base.id ? { ...v, offers: renameInOffers(v.offers) } : v
            )
          );
        } else {
          // Shadow the prop vertical with renamed offer
          setLocalVerticals(prev => [
            ...prev,
            { ...base, offers: renameInOffers(base.offers) },
          ]);
        }
      }
    }
  }

  // All verticals merged: prop ones first, then locally created
  const allVerticals = [...verticals, ...localVerticals];

  // Names for the offer modal dropdown
  const allVerticalNames = allVerticals.map(v => v.name);

  function handleSaveVertical(name: string) {
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setLocalVerticals(prev => [...prev, { id, name, promise: 0, netPromise: 0, platforms: [], offers: [] }]);
  }

  function handleSaveOffer(offerName: string, verticalName: string) {
    const offerId = offerName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const newOffer = { id: offerId, name: offerName };

    // Try to update in localVerticals first
    const inLocal = localVerticals.some(v => v.name === verticalName);
    if (inLocal) {
      setLocalVerticals(prev =>
        prev.map(v =>
          v.name === verticalName
            ? { ...v, offers: [...(v.offers ?? []), newOffer] }
            : v
        )
      );
    } else {
      // It's in the prop verticals — we can't mutate props directly.
      // Instead, clone it into localVerticals with the new offer appended.
      const base = verticals.find(v => v.name === verticalName);
      if (base) {
        const existing = localVerticals.find(v => v.id === base.id);
        if (existing) {
          setLocalVerticals(prev =>
            prev.map(v =>
              v.id === base.id
                ? { ...v, offers: [...(v.offers ?? []), newOffer] }
                : v
            )
          );
        } else {
          // Shadow the prop vertical with added offer
          setLocalVerticals(prev => [
            ...prev,
            { ...base, offers: [...(base.offers ?? []), newOffer] },
          ]);
        }
      }
    }
  }

  // Merge: for verticals that have a shadow in localVerticals, use the local version
  const mergedVerticals = [
    ...verticals.map(v => localVerticals.find(lv => lv.id === v.id) ?? v),
    ...localVerticals.filter(lv => !verticals.some(v => v.id === lv.id)),
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Top row: heading on left, buttons + filters on right */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111928] dark:text-white">Select a Vertical</h2>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">Click an offer to view its performance detail</p>
        </div>

        <div className="shrink-0 pt-1 flex items-center gap-2">
          <PromiseFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </div>
      </div>

      {/* Tree view — all verticals in a responsive wrap */}
      <div className="flex flex-wrap gap-16 justify-start">
        {mergedVerticals.map(v => (
          <VerticalTree
            key={v.id}
            vertical={v}
            onOfferClick={(id) => onSelect?.(id)}
            onEditOffer={handleEditOffer}
          />
        ))}
      </div>

      {/* Edit Offer modal — pre-filled with the clicked offer name */}
      <CreateOfferModal
        open={showEditOfferModal}
        onClose={() => setShowEditOfferModal(false)}
        onSave={handleEditOfferSave}
        verticals={allVerticalNames}
        initialOfferName={editOfferName}
      />
    </div>
  );
}
