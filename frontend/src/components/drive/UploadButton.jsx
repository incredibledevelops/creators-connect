"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function UploadButton({ onUploaded }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.upload("/drive/upload", fd);
      onUploaded?.(res.file);
    } catch (err) {
      toast.show(err.message, "error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-soft transition disabled:opacity-60"
      >
        {busy ? "Uploading…" : "+ Upload"}
      </button>
      <input ref={inputRef} type="file" className="hidden" onChange={onChange} />
    </>
  );
}