"use client";

const OPTIONS = [
  { value: "IG", label: "Instagram", color: "bg-pink-500" },
  { value: "TT", label: "TikTok", color: "bg-ink" },
  { value: "YT", label: "YouTube", color: "bg-red-500" },
  { value: "X", label: "X", color: "bg-slate-900" },
  { value: "FB", label: "Facebook", color: "bg-blue-600" },
];

export default function PlatformPicker({ selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
              active
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${o.color}`} /> {o.label}
          </button>
        );
      })}
    </div>
  );
}