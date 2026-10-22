import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

export default function Select({ label, className, children, ...rest }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-ink mb-1.5">{label}</label>}
      <select
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

Select.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};