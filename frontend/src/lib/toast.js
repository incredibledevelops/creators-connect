"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const show = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => {
      // Keep only the latest 2 toasts, then add the new one (max 3 on screen)
      const latest = prev.slice(-2);
      return [...latest, { id, message, type }];
    });
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-[80] bottom-4 right-4 left-4 sm:left-auto space-y-2 flex flex-col items-stretch sm:items-end pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pop pointer-events-auto flex items-center gap-2.5 ${
              t.type === "error" ? "bg-rose-600" : "bg-ink"
            } text-white text-sm font-medium pl-3.5 pr-5 py-3 rounded-xl shadow-soft max-w-sm`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}