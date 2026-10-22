"use client";

import { relativeTime } from "@/lib/utils";

export default function ActivityFeed({ items }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card h-full">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-display font-bold text-ink">Recent activity</h3>
      </div>
      <div className="p-5 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-500">No activity yet. Start a project or send a message.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-slate-700">{item.title}</p>
              {item.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">{relativeTime(item.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}