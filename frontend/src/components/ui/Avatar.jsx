import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export default function Avatar({ src, name, size = "md", className }) {
  const sizes = { sm: "w-7 h-7 text-[10px]", md: "w-9 h-9 text-xs", lg: "w-12 h-12 text-sm" };
  if (src) {
    return (
      <img
        src={src}
        alt={name || ""}
        className={cn("rounded-full object-cover bg-slate-100", sizes[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "rounded-full bg-gradient-to-br from-brand-500 to-mint-500 text-white font-bold grid place-items-center",
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

Avatar.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
};