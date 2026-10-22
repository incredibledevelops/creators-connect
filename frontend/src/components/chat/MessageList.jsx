"use client";

import { useEffect, useRef } from "react";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import { relativeTime } from "@/lib/utils";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({ conversation, messages, typing }) {
  const { user } = useAuth();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const typingNames = Object.values(typing).filter(Boolean);

  return (
    <>
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 shrink-0">
        <Avatar
          src={conversation?.participants?.[0]?.avatar_url}
          name={conversation?.name || conversation?.participants?.[0]?.full_name || "Chat"}
        />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-ink text-sm truncate">
            {conversation?.name || conversation?.participants?.[0]?.full_name || "Conversation"}
          </p>
          <p className="text-xs text-mint-600 font-medium">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-400">
            No messages yet. Say hi 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender?.id === user?.id || m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex gap-2.5 ${mine ? "justify-end" : ""}`}>
              {!mine && <Avatar src={m.sender?.avatar_url} name={m.sender?.full_name} size="sm" className="mt-auto" />}
              <div className="max-w-[78%] sm:max-w-[70%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  {m.content}
                  {m.attachments?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.attachments.map((a, i) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block text-xs underline ${mine ? "text-white/90" : "text-brand-600"}`}
                        >
                          {a.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-[10px] text-slate-400 mt-1 ${mine ? "text-right mr-1" : "ml-1"}`}>
                  {relativeTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <TypingIndicator names={typingNames} />
        <div ref={endRef} />
      </div>
    </>
  );
}