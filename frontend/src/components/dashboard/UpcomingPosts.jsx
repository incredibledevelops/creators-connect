"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

const PLATFORM_STYLES = {
  IG: "bg-gradient-to-br from-pink-500 to-orange-400",
  TT: "bg-ink",
  YT: "bg-red-500",
  X: "bg-slate-900",
  FB: "bg-blue-600",
};

export default function UpcomingPosts({ posts }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <h3 className="font-display font-bold text-ink">Upcoming posts</h3>
        <Link href="/scheduler" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          View calendar
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {posts.length === 0 && (
          <p className="p-5 text-sm text-slate-500">No upcoming posts. Schedule something.</p>
        )}
        {posts.map((p) => {
          const platform = p.platforms?.[0] || "X";
          return (
            <div key={p.id} className="flex items-center gap-3.5 p-4 sm:p-5 hover:bg-slate-50/60 transition">
              <span
                className={`w-9 h-9 rounded-xl grid place-items-center text-white text-[10px] font-extrabold shrink-0 ${PLATFORM_STYLES[platform] || "bg-slate-900"}`}
              >
                {platform}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{p.caption || "Untitled post"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(p.scheduled_for)}</p>
              </div>
              <span className="text-[10px] font-bold text-mint-700 bg-mint-100 px-2 py-1 rounded-md shrink-0">
                {p.status?.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}