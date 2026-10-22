"use client";

import Avatar from "@/components/ui/Avatar";

export default function MemberTable({ owner, members, loading, onRemove }) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const all = [];
  if (owner) all.push({ ...owner, role: "owner" });
  (members || []).forEach((m) => {
    if (!owner || m.id !== owner.id) all.push({ ...m, role: m.role || "editor" });
  });

  return (
    <div className="divide-y divide-slate-100">
      {all.map((m) => (
        <div key={m.id} className="flex items-center gap-3 p-4">
          <Avatar src={m.avatar_url} name={m.full_name} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink truncate">{m.full_name}</p>
            <p className="text-[11px] text-slate-500 truncate">{m.email || m.handle}</p>
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {m.role}
          </span>
          {m.role !== "owner" && (
            <button
              onClick={() => onRemove(m.id)}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}