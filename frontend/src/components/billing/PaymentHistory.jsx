"use client";

import { formatDate, formatGHS } from "@/lib/utils";

export default function PaymentHistory({ payments, loading, currency }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-display font-bold text-ink">Invoices</h3>
      </div>
      {loading ? (
        <div className="p-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">No payments yet.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          <div className="hidden sm:grid grid-cols-[1fr_140px_120px_100px] gap-3 px-5 py-2.5 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Invoice</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {payments.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-2 sm:grid-cols-[1fr_140px_120px_100px] gap-2 sm:gap-3 px-5 py-4 items-center"
            >
              <span className="text-sm font-semibold text-ink truncate">#{p.reference}</span>
              <span className="text-xs text-slate-500 sm:text-sm">{formatDate(p.created_at)}</span>
              <span className="text-sm text-slate-700 font-semibold">
                {formatGHS(p.amount_ghs)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-md justify-self-start ${
                  p.status === "success"
                    ? "text-mint-700 bg-mint-100"
                    : p.status === "failed"
                    ? "text-rose-700 bg-rose-100"
                    : "text-amber-700 bg-amber-100"
                }`}
              >
                {p.status?.toUpperCase() || "PENDING"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}