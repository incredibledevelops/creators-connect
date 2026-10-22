"use client";

export default function FileBrowser({ files, loading, connected }) {
  if (!connected) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Connect Google Drive to browse and upload files.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!files.length) {
    return <div className="p-8 text-center text-sm text-slate-500">No files yet.</div>;
  }
  return (
    <div className="divide-y divide-slate-100">
      {files.map((f) => (
        <div
          key={f.id}
          className="grid grid-cols-[1fr_48px] sm:grid-cols-[1fr_120px_140px_48px] items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-slate-100 grid place-items-center text-slate-500 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v4h4" />
              </svg>
            </span>
            <a
              href={f.webViewLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-semibold text-ink truncate">{f.name}</p>
              <p className="text-[11px] text-slate-400 sm:hidden">
                {f.size ? `${Math.round(f.size / 1024)} KB` : "—"} ·{" "}
                {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : "—"}
              </p>
            </a>
          </div>
          <span className="hidden sm:block text-xs text-slate-500">
            {f.size ? `${Math.round(f.size / 1024)} KB` : "—"}
          </span>
          <span className="hidden sm:block text-xs text-slate-500">
            {f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : "—"}
          </span>
          <a
            href={f.webViewLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-brand-600 hover:text-brand-700 justify-self-end"
          >
            Open
          </a>
        </div>
      ))}
    </div>
  );
}