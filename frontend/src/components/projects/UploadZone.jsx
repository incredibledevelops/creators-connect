"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function UploadZone({ projectId, onUploaded }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.upload(`/projects/${projectId}/upload`, fd);
      toast.show("Uploaded to Drive.");
      onUploaded?.();
    } catch (err) {
      toast.show(err.message, "error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      onClick={pick}
      className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-400 bg-white p-8 text-center transition"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center mx-auto">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">
        {busy ? "Uploading…" : "Upload a file to this project"}
      </p>
      <p className="text-xs text-slate-500 mt-1">Stored in your Google Drive.</p>
      <input ref={inputRef} type="file" className="hidden" onChange={onFile} disabled={busy} />
    </div>
  );
}