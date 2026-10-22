"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/layout/AppShell";

export default function AppLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          Loading your studio…
        </div>
      </div>
    );
  }
  if (!user) return null;
  return <AppShell>{children}</AppShell>;
}