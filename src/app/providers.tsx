"use client";

import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/store/StoreProvider";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthProvider>{children}</AuthProvider>
    </StoreProvider>
  );
}
