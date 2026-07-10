"use client";

import { useState, useEffect, useRef } from "react";
import { LuUserRound, LuLogOut } from "react-icons/lu";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/app/utils/axios";

/* --- Role label helper ---------------------------------------------- */
function roleLabel(raw: string): string {
  const r = String(raw ?? "").toLowerCase();
  switch (r) {
    case "tl":           return "Team Leader";
    case "ct_tl":        return "Creative Team Leader";
    case "ct_user":      return "Creative User";
    case "admin":        return "Admin";
    case "superadmin":   return "Superadmin";
    case "user":         return "User";
    case "finance_admin":return "Finance Admin";
    case "finance_team": return "Finance Team";
    case "ad_ops_manager":return "Ad Ops Manager";
    default:             return r ? r.charAt(0).toUpperCase() + r.slice(1) : "User";
  }
}

function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* --- UserInfo dropdown --------------------------------------------- */
export function UserInfo() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const displayRole = user?.role || "user";
  const initials = getInitials(displayName);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      const response = await api.post("/api/v1/auth/logout", {}, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (response?.data?.success) {
        toast.success(response?.data?.message || "Logout successfully");
      } else {
        toast.error(response?.data?.message || "Token expired");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message;
      toast.error(msg || "Session expired. Please login again.");
    } finally {
      logout();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative select-none" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => setIsOpen(p => !p)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5750F1] text-white text-xs font-semibold shrink-0 hover:bg-[#4742d4] transition-colors ring-2 ring-transparent hover:ring-[#5750F1]/30"
      >
        {initials}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 z-50 w-72">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-[#0d1520]/95 border border-white/20 dark:border-white/10">

            {/* Glow blobs */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 blur-2xl rounded-full" />
            </div>

            <div className="relative z-10">
              {/* User info header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5750F1] text-white text-sm font-bold border border-white/30 shadow">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#111928] dark:text-gray-100 truncate">{displayName}</div>
                  <div className="text-[10px] text-[#6B7280] dark:text-gray-400 truncate">{displayEmail}</div>
                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-300">
                    {roleLabel(displayRole)}
                  </div>
                </div>
              </div>

              <hr className="border-[#E6EBF1] dark:border-white/10" />

              {/* Profile */}
              <div className="p-2">
                <button
                  onClick={() => { setIsOpen(false); router.push("/profile"); }}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[#111928] dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                >
                  <LuUserRound size={18} />
                  <span className="text-sm">Profile</span>
                </button>
              </div>

              <hr className="border-[#E6EBF1] dark:border-white/10" />

              {/* Log Out */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LuLogOut size={18} />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
