"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

const TITLES = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/chat": "Messages",
  "/scheduler": "Scheduler",
  "/drive": "Google Drive",
  "/workspace": "Workspace",
  "/billing": "Billing",
  "/settings": "Settings",
};

export default function TopBar({ onOpenSidebar }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const title =
    TITLES[pathname] ||
    Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] ||
    "Creators Connect";

  const trialDays = (() => {
    if (user?.subscription?.status !== "trialing") return null;
    const end = user?.subscription?.trial_ends_at;
    if (!end) return null;
    return Math.max(0, Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24)));
  })();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6">
      <button
        onClick={onOpenSidebar}
        className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <h1 className="font-display font-extrabold text-ink text-base sm:text-lg tracking-tight">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {trialDays !== null && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-mint-50 border border-mint-200 px-2.5 py-1.5 text-[11px] font-bold text-mint-700">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-500" /> TRIAL · {trialDays}d
          </span>
        )}
        <img
          src={user?.avatar_url || `https://i.pravatar.cc/80?u=${user?.id}`}
          alt=""
          className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      </div>
    </header>
  );
}