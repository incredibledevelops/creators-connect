"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, FolderKanban, MessagesSquare, CalendarClock, HardDrive, Users, CreditCard, Settings, ShieldAlert
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/chat", label: "Messages", icon: MessagesSquare },
  { href: "/scheduler", label: "Scheduler", icon: CalendarClock },
  { href: "/drive", label: "Google Drive", icon: HardDrive },
  { href: "/workspace", label: "Workspace", icon: Users },
];

const ACCOUNT = [
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const renderLink = (item) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
          active
            ? "bg-brand-50 text-brand-700 font-semibold"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="fixed z-40 inset-y-0 left-0 w-[272px] bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 grid place-items-center text-white font-display font-extrabold shadow-sm">
            C
          </span>
          <span className="font-display font-extrabold text-[15px] text-ink tracking-tight">
            Creators Connect
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
          Workspace
        </p>
        {NAV.map(renderLink)}
        
        {user?.role === "admin" && (
          <>
            <p className="px-3 pt-5 pb-2 text-[10px] font-bold tracking-[0.14em] text-rose-400 uppercase">
              System
            </p>
            <Link
              href="/admin"
              onClick={onNavigate}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                pathname === "/admin" ? "bg-rose-50 text-rose-700 font-semibold" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <ShieldAlert className="w-[18px] h-[18px] shrink-0" />
              Admin Panel
            </Link>
          </>
        )}

        <p className="px-3 pt-5 pb-2 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
          Account
        </p>
        {ACCOUNT.map(renderLink)}
      </nav>

      <div className="p-3 shrink-0">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative">
            <p className="text-[10px] font-bold tracking-[0.12em] text-brand-200 uppercase">
              {user?.subscription?.status === "trialing" ? "Free trial" : "Subscription"}
            </p>
            <p className="mt-1 font-display font-extrabold text-lg leading-tight">
              {user?.subscription?.plan || "Trial"}
            </p>
            <Link
              href="/billing"
              className="mt-3 block text-center py-2 rounded-lg bg-white text-brand-700 text-xs font-bold hover:bg-brand-50 transition"
            >
              Manage plan
            </Link>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 shrink-0">
        <div className="w-full flex items-center gap-3 rounded-xl p-2">
          <img
            src={user?.avatar_url || `https://i.pravatar.cc/80?u=${user?.id}`}
            alt=""
            className="w-9 h-9 rounded-full object-cover bg-slate-100"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate">{user?.full_name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}