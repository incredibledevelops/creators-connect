"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarStrip({ posts }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10));

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const postsByDay = {};
  posts.forEach((p) => {
    const key = new Date(p.scheduled_for).toISOString().slice(0, 10);
    postsByDay[key] = (postsByDay[key] || 0) + 1;
  });

  const changeWeek = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-card">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="font-display font-bold text-ink text-sm">
          {weekStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => changeWeek(-1)}
            className="w-8 h-8 rounded-lg border border-slate-200 grid place-items-center text-slate-500 hover:bg-slate-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <button
            onClick={() => changeWeek(1)}
            className="w-8 h-8 rounded-lg border border-slate-200 grid place-items-center text-slate-500 hover:bg-slate-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const active = key === selected;
          const count = postsByDay[key] || 0;
          const isToday = key === new Date().toISOString().slice(0, 10);
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={cn(
                "rounded-xl border py-2.5 text-center transition",
                active
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <p className={cn("text-[10px] font-semibold uppercase", active ? "text-white" : "text-slate-400")}>
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p className={cn("font-display font-bold text-sm mt-0.5", active ? "text-white" : "text-ink")}>
                {String(d.getDate()).padStart(2, "0")}
              </p>
              <span
                className={cn(
                  "block w-1.5 h-1.5 rounded-full mx-auto mt-1.5",
                  active ? "bg-white" : isToday ? "bg-brand-500" : count ? "bg-brand-400" : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}