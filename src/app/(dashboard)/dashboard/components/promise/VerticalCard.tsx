"use client";

/* --- Types ----------------------------------------------------------- */
export interface VerticalOffer {
  id: string;
  name: string;
  promise?: number;
  netPromise?: number;
  actuals?: number;
  offerIds?: string[];
}

export interface VerticalData {
  id: string;
  name: string;
  promise: number;
  netPromise: number;
  actuals?: number;
  hasWarning?: boolean;
  platforms: { icon: "meta" | "taboola"; count?: number }[];
  offers?: VerticalOffer[];
}
