
import Progress from "@/components/ui/Progress";

export default function SeatBar({ used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-ink">Seats used</p>
        <p className="text-sm font-bold text-ink">
          {used} / {limit}
        </p>
      </div>
      <Progress value={pct} />
      <p className="text-xs text-slate-500 mt-2">
        {used >= limit
          ? "You've reached your plan's seat limit. Upgrade to invite more people."
          : `${limit - used} seat(s) remaining on your current plan.`}
      </p>
    </div>
  );
}