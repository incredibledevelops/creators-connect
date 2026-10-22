"use client";

import { formatDateTime } from "@/lib/utils";

const PLATFORM_STYLES = {
  IG: "bg-gradient-to-br from-pink-500 to-orange-400",
  TT: "bg-ink",
  YT: "bg-red-500",
  X: "bg-slate-900",
  FB: "bg-blue-600",
};

export default function QueueList({ posts, loading, onPublishNow, onDelete }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        No scheduled posts yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-display font-bold text-ink">Queue</h3>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {posts.length} POSTS
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {posts.map((p) => {
          const platform = p.platforms?.[0] || "X";
          const published = p.status === "published";
          return (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5 hover:bg-slate-50/60 transition">
              <span
                className={`w-9 h-9 rounded-xl grid place-items-center text-white text-[10px] font-extrabold shrink-0 ${PLATFORM_STYLES[platform] || "bg-slate-900"}`}
              >
                {platform}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{p.caption || "Untitled post"}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDateTime(p.scheduled_for)} · {p.platforms?.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    published
                      ? "text-mint-700 bg-mint-100"
                      : p.status === "failed"
                      ? "text-rose-700 bg-rose-100"
                      : "text-amber-700 bg-amber-100"
                  }`}
                >
                  {(p.status || "queued").toUpperCase()}
                </span>
                {!published && p.status !== "failed" && (
                  <button
                    onClick={() => onPublishNow(p.id)}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700"
                  >
                    Publish now
                  </button>
                )}
                <button
                  onClick={() => onDelete(p.id)}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}