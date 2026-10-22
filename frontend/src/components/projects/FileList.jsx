"use client";

import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function FileList({ files, projectId, onReload }) {
  const toast = useToast();

  const remove = async (fileId) => {
    if (!confirm("Remove this file from the project?")) return;
    try {
      await api.del(`/projects/${projectId}/files/${fileId}`);
      toast.show("File removed.");
      onReload();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  if (!files.length) {
    return <p className="text-sm text-slate-500">No files yet. Upload the first one below.</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((f) => (
        <div
          key={f.drive_file_id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
        >
          <span className="w-8 h-8 rounded-lg bg-slate-100 grid place-items-center text-slate-500 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v4h4" />
            </svg>
          </span>
          <a
            href={f.web_view_link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1"
          >
            <p className="text-sm font-semibold text-ink truncate">{f.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {f.mime_type} · {f.size ? `${Math.round(f.size / 1024)} KB` : "—"}
            </p>
          </a>
          <button
            onClick={() => remove(f.drive_file_id)}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}