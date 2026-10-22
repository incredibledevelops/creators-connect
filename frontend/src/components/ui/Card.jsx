import { cn } from "@/lib/utils";

export default function Card({ className, children, ...rest }) {
  return (
    <div
      className={cn("bg-white rounded-2xl border border-slate-200 shadow-card", className)}
      {...rest}
    >
      {children}
    </div>
  );
}