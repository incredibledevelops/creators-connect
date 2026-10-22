"use client";

import Avatar from "@/components/ui/Avatar";

export default function MemberList({ owner, members }) {
  const all = [owner, ...(members || [])].filter(Boolean);
  return (
    <div className="space-y-3">
      {all.map((m, idx) => (
        <div key={`${m.id}-${idx}`} className="flex items-center gap-3">
          <Avatar src={m.avatar_url} name={m.full_name} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate">
              {m.full_name} {idx === 0 && <span className="text-[10px] text-brand-600">· OWNER</span>}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{m.handle || m.email || ""}</p>
          </div>
          {m.role && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {m.role}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}