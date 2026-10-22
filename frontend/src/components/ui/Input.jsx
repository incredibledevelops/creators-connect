import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

export default function Input({ label, error, className, ...rest }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-ink mb-1.5">{label}</label>}
      <input
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition",
          error && "border-rose-400 focus:border-rose-400 focus:ring-rose-100",
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
    </div>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
};