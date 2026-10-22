"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAccessToken, setAccessToken, setUnauthenticatedHandler } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((token) => {
    setAccessToken(token);
    setAccessTokenState(token);
  }, []);

  const clearSession = useCallback(async () => {
    applyToken(null);
    setUser(null);
    await fetch("/api/auth/clear", { method: "POST" }).catch(() => {});
  }, [applyToken]);

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.user);
      return res.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        applyToken(data.access_token);
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [applyToken]);

  useEffect(() => {
    setUnauthenticatedHandler(() => {
      setUser(null);
      applyToken(null);
      router.replace("/login");
    });
    bootstrap();
  }, [bootstrap, router, applyToken]);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post("/auth/login", { email, password });
      await fetch("/api/auth/set-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: res.refresh_token }),
      });
      applyToken(res.access_token);
      setUser(res.user);
      return res.user;
    },
    [applyToken]
  );

  const signup = useCallback(
    async (full_name, email, password) => {
      const res = await api.post("/auth/register", { full_name, email, password });
      await fetch("/api/auth/set-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: res.refresh_token }),
      });
      applyToken(res.access_token);
      setUser(res.user);
      return res.user;
    },
    [applyToken]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {}
    await clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, accessToken, login, signup, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}