import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

export default function Textarea({ label, error, className, ...rest }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-ink mb-1.5">{label}</label>}
      <textarea
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition resize-none",
          error && "border-rose-400",
          className
        )}
        {...rest}
      />
      {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
    </div>
  );
}

Textarea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
};