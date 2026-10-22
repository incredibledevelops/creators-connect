"use client";

import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function DriveStatusCard({ status, onConnect, onDisconnect }) {
  if (!status) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card animate-pulse h-40" />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 grid place-items-center shrink-0">
          <svg className="w-7 h-7" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M17 6h14l13 22H30L17 6Z" />
            <path fill="#1976D2" d="M4 39 17 6l7 12-13 21H4Z" />
            <path fill="#4CAF50" d="M11 39 24 17l6 10-7 12H11Z" />
            <path fill="#1E88E5" d="M17 39h24l-6-10H23l-6 10Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-ink">
              {status.connected ? "Connected" : "Not connected"}
            </p>
            {status.connected && (
              <span className="text-[10px] font-bold text-mint-700 bg-mint-100 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {status.connected
              ? `${status.google_email || "Google Drive"} · linked ${formatDate(status.connected_at)}`
              : "Link your Google Drive to store scheduled media."}
          </p>
        </div>
        <div className="flex gap-2">
          {status.connected ? (
            <Button variant="secondary" onClick={onDisconnect} size="sm">
              Disconnect
            </Button>
          ) : (
            <Button onClick={onConnect} size="sm">
              Connect Drive
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}