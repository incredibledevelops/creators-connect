import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-brand-50 text-brand-700",
  mint: "bg-mint-100 text-mint-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  ink: "bg-ink text-white",
};

export default function Badge({ tone = "neutral", children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-md",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  tone: PropTypes.oneOf(["neutral", "brand", "mint", "amber", "rose", "ink"]),
  children: PropTypes.node,
  className: PropTypes.string,
};