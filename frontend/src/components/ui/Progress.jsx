import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

export default function Progress({ value = 0, className, barClassName }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 rounded-full bg-slate-100 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r from-brand-500 to-mint-500", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

Progress.propTypes = {
  value: PropTypes.number,
  className: PropTypes.string,
  barClassName: PropTypes.string,
};