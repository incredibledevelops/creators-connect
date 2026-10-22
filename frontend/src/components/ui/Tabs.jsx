"use client";

import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition",
              isActive
                ? "bg-ink text-white border-ink"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  active: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};