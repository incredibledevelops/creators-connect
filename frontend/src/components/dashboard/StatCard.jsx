import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const ACCENTS = {
  brand: "bg-brand-50 text-brand-600",
  mint: "bg-mint-50 text-mint-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function StatCard({ label, value, accent = "brand" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className={cn("w-7 h-7 rounded-lg grid place-items-center", ACCENTS[accent])}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.oneOf(["brand", "mint", "amber", "violet"]),
};