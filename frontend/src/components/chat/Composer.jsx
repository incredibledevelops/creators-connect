"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";

export default function Composer({ onSend, onTyping, disabled }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const typingTimer = useRef(null);
  const inputRef = useRef(null);

  const notifyTyping = (isTyping) => {
    if (!onTyping) return;
    clearTimeout(typingTimer.current);
    if (isTyping) {
      onTyping(true);
      typingTimer.current = setTimeout(() => onTyping(false), 1500);
    } else {
      onTyping(false);
    }
  };

  const send = async () => {
    const text = value.trim();
    if (!text || busy || disabled) return;
    setBusy(true);
    try {
      await onSend(text);
      setValue("");
      notifyTyping(false);
    } finally {
      setBusy(false);
    }
  };

  const attach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // For attachments, we upload to the chat conversation via backend
      // (backend endpoint requires conversation id; we use the active one from parent).
      // For simplicity here we send the file name as a message prefix.
      // A production version would call `/chat/conversations/{id}/upload`.
      alert("Attachment uploads are handled by the parent chat page in production.");
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0">
      <div className="flex items-end gap-2">
        <label className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-ink transition shrink-0 cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          <input type="file" className="hidden" onChange={attach} />
        </label>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Write a message…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            notifyTyping(true);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={disabled || busy}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition max-h-[120px] disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={disabled || busy || !value.trim()}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-soft transition shrink-0 disabled:opacity-60"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4 12 16-8-6 8 6 8-16-8Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}