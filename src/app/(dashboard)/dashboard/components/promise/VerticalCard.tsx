"use client";

/* --- Types ----------------------------------------------------------- */
export interface VerticalOffer {
  id: string;
  name: string;
  promise?: number;
  netPromise?: number;
}

export interface VerticalData {
  id: string;
  name: string;
  promise: number;
  netPromise: number;
  hasWarning?: boolean;
  platforms: { icon: "meta" | "taboola"; count?: number }[];
  offers?: VerticalOffer[];
}
