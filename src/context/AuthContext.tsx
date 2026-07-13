"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, setCredentials, logout as logoutRedux } from "@/store/slices/user.slice";

interface User {
  name?: string;
  email?: string;
  role?: string;
  profile_pic?: string;
  number?: string;
  media_buyer_code?: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY_TOKEN = "lmp_access_token";
const STORAGE_KEY_USER = "lmp_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (storedToken) {
        setToken(storedToken);
        dispatch(setCredentials(storedToken));
      }
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserState(parsedUser);
        dispatch(setReduxUser(parsedUser));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [dispatch]);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUserState(newUser);
    dispatch(setCredentials(newToken));
    dispatch(setReduxUser(newUser));
    try {
      localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    } catch {
      // ignore
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
    dispatch(logoutRedux());
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // ignore
    }
    router.push("/login");
  }, [router, dispatch]);

  const setUser = useCallback((u: User) => {
    setUserState(u);
    dispatch(setReduxUser(u));
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
    } catch {
      // ignore
    }
  }, [dispatch]);

  // Don't render until hydrated to avoid flash
  if (!hydrated) return null;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
