"use client";

import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand-600 hover:bg-brand-700 text-white shadow-soft disabled:opacity-60 disabled:hover:bg-brand-600",
  secondary:
    "bg-white border border-slate-200 hover:border-slate-300 text-ink disabled:opacity-60",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-rose-600 hover:bg-rose-700 text-white",
  ink: "bg-ink hover:bg-slate-800 text-white",
};
const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.99]",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

Button.propTypes = {
  as: PropTypes.elementType,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost", "danger", "ink"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  children: PropTypes.node,
};