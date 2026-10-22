"use client";

import Avatar from "@/components/ui/Avatar";
import { cn, relativeTime } from "@/lib/utils";

export default function ConversationList({ conversations, activeId, onSelect }) {
  if (!conversations.length) {
    return (
      <div className="text-sm text-slate-500 p-3 bg-white rounded-2xl border border-slate-200">
        No conversations yet. Create a project to start a room.
      </div>
    );
  }
  return (
    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar md:max-h-[600px] md:pr-1">
      {conversations.map((c) => {
        const isActive = c.id === activeId;
        const title =
          c.name ||
          c.participants?.[0]?.full_name ||
          (c.type === "dm" ? "Direct message" : "Project room");
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "shrink-0 min-w-[230px] md:min-w-0 flex items-center gap-3 rounded-xl border p-3 text-left transition",
              isActive
                ? "border-brand-300 bg-brand-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <Avatar src={c.participants?.[0]?.avatar_url} name={title} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink truncate">{title}</p>
                {c.unread_count > 0 && (
                  <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                    {c.unread_count}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {c.last_message?.content || "No messages yet"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {relativeTime(c.last_message_at)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}