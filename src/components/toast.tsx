"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastTone = "good" | "bad" | "warn" | "info";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

const tones: Record<ToastTone, string> = {
  good: "border-good bg-good-soft text-good",
  bad: "border-bad bg-bad-soft text-bad",
  warn: "border-warn bg-warn-soft text-warn",
  info: "border-brand bg-white text-navy",
};

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, message, tone }].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,24rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto border-l-4 px-4 py-3 text-sm font-semibold shadow-card ${tones[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast must be used inside ToastProvider");
  return push;
}
