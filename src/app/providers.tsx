"use client";

import { AuthProvider } from "@/context/AuthContext";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
