"use client";

import { useState, useRef, useEffect } from "react";
import type { VerticalData } from "./VerticalCard";
import PromiseFilters from "./PromiseFilters";
import { LuPlus, LuX, LuChevronDown, LuTriangleAlert } from "react-icons/lu";

/* --- Create Vertical Modal --------------------------------------------- */
function CreateVerticalModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setName(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const handleSave = () => {
    const v = name.trim();
    if (!v) return;
    onSave(v);
    onClose();
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
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          placeholder="e.g. Blood Sugar"
          className="w-full rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm text-[#111928] dark:text-white placeholder:text-[#9CA3AF] outline-none focus:border-[#5750F1] transition-colors mb-4"
        />
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Save Vertical</button>
        </div>
      </div>
    </>
  );
}

/* --- Create Offer Modal ------------------------------------------------- */
function CreateOfferModal({
  open,
  onClose,
  onSave,
  verticals,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (offerName: string, verticalName: string) => void;
  verticals: string[];
}) {
  const [offerName, setOfferName] = useState("");
  const [selectedVertical, setSelectedVertical] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setOfferName("");
      setSelectedVertical(verticals[0] ?? "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, verticals]);

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

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#111928] dark:text-white mb-1.5">Vertical <span className="text-[#5750F1]">*</span></label>
          {verticals.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] italic">No verticals yet — create one first.</p>
          ) : (
            <div className="relative">
              <select value={selectedVertical} onChange={e => setSelectedVertical(e.target.value)} className="w-full appearance-none rounded-lg border border-[#E6EBF1] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#0a1018] px-3 py-2 text-sm text-[#111928] dark:text-white outline-none focus:border-[#5750F1] transition-colors cursor-pointer">
                {verticals.map(v => <option key={v}>{v}</option>)}
              </select>
              <LuChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-[#E6EBF1] dark:border-[#374151] px-4 py-2 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332] transition-colors">Cancel</button>
          <button
            onClick={() => { onSave(offerName.trim(), selectedVertical); onClose(); }}
            disabled={!offerName.trim() || !selectedVertical}
            className="rounded-lg bg-[#5750F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4742d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Offer
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
}: {
  vertical: VerticalData;
  onOfferClick: (verticalId: string) => void;
}) {
  const offers = vertical.offers ?? [];

  // All nodes expanded by default
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(
    new Set((vertical.offers ?? []).map(o => o.id))
  );
  const [rootExpanded, setRootExpanded] = useState(true);

  const toggleOffer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOffers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

  // Totals for root
  const totalPromise    = offers.reduce((s, o) => s + (o.promise    ?? 0), 0);
  const totalNetPromise = offers.reduce((s, o) => s + (o.netPromise ?? 0), 0);

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
          {/* Expand toggle */}
          <button
            onClick={e => { e.stopPropagation(); setRootExpanded(p => !p); }}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#2563eb]/40 text-[#2563eb] hover:bg-[#2563eb]/10 transition-colors text-[10px] font-bold"
          >
            {rootExpanded ? "−" : "+"}
          </button>
        </div>

        {/* Expanded details */}
        {rootExpanded && (
          <div className="w-full px-4 pb-2.5 pt-0 border-t border-[#2563eb]/20">
            <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-1.5">
              Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(totalPromise)}</span>
            </p>
            <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
              Net Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(totalNetPromise)}</span>
            </p>
          </div>
        )}
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
              const isExpanded = expandedOffers.has(offer.id);
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
                      {/* Expand toggle */}
                      <button
                        onClick={e => toggleOffer(offer.id, e)}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#E6EBF1] dark:border-[#374151] text-[#6B7280] hover:border-[#2563eb]/50 hover:text-[#2563eb] transition-colors text-[10px] font-bold"
                      >
                        {isExpanded ? "−" : "+"}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-2.5 pb-2 border-t border-[#E6EBF1] dark:border-[#374151] pt-1.5">
                        <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                          Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(offer.promise ?? 0)}</span>
                        </p>
                        <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                          Net Promise: <span className="font-semibold text-[#111928] dark:text-white">{fmt(offer.netPromise ?? 0)}</span>
                        </p>
                      </div>
                    )}
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

  const [showCreateVertical, setShowCreateVertical] = useState(false);
  const [showCreateOffer,    setShowCreateOffer]    = useState(false);

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
          <button
            onClick={() => setShowCreateVertical(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuPlus size={13} />
            Create Vertical
          </button>
          <button
            onClick={() => setShowCreateOffer(true)}
            className="flex items-center gap-1.5 rounded-md border border-[#E6EBF1] dark:border-[#374151] bg-white dark:bg-[#0d1520] px-3 py-1.5 text-xs font-medium text-[#111928] dark:text-white hover:border-[#5750F1]/40 transition-colors"
          >
            <LuPlus size={13} />
            Create Offer
          </button>
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
          />
        ))}
      </div>

      {/* Modals */}
      <CreateVerticalModal
        open={showCreateVertical}
        onClose={() => setShowCreateVertical(false)}
        onSave={handleSaveVertical}
      />
      <CreateOfferModal
        open={showCreateOffer}
        onClose={() => setShowCreateOffer(false)}
        onSave={handleSaveOffer}
        verticals={allVerticalNames}
      />
    </div>
  );
}
