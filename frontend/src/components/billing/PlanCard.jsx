"use client";

import Button from "@/components/ui/Button";
import { formatGHS } from "@/lib/utils";

export default function PlanCard({ plan, currency, current, onSubscribe }) {
  const isPopular = plan.id === "pro";
  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col ${
        isPopular ? "bg-ink text-white shadow-soft" : "bg-white border border-slate-200 shadow-card"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide bg-mint-400 text-mint-900 px-2.5 py-1 rounded-full">
          MOST POPULAR
        </span>
      )}
      <div className="flex items-center justify-between">
        <h3 className={`font-display font-bold text-lg ${isPopular ? "text-white" : "text-ink"}`}>
          {plan.name}
        </h3>
        {current && (
          <span className="text-[10px] font-bold uppercase bg-mint-400 text-mint-900 px-2 py-1 rounded-full">
            CURRENT
          </span>
        )}
      </div>
      <p className={`text-sm mt-1 ${isPopular ? "text-slate-400" : "text-slate-500"}`}>
        {plan.description}
      </p>
      <div className="mt-5 flex items-end gap-1">
        <span className={`font-display text-4xl font-extrabold ${isPopular ? "text-white" : "text-ink"}`}>
          {formatGHS(plan.price_ghs).replace("GH₵", "₵")}
        </span>
        <span className={`text-sm mb-1.5 ${isPopular ? "text-slate-400" : "text-slate-500"}`}>
          /30 days
        </span>
      </div>
      <ul className={`mt-6 space-y-3 text-sm flex-1 ${isPopular ? "text-slate-300" : "text-slate-600"}`}>
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <span className={`font-bold ${isPopular ? "text-mint-400" : "text-mint-500"}`}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Button
        onClick={onSubscribe}
        disabled={current}
        variant={isPopular ? "primary" : "secondary"}
        className="mt-7 w-full"
      >
        {current ? "Your plan" : "Subscribe"}
      </Button>
    </div>
  );
}