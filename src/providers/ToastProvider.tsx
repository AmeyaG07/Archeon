"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/** Imperative helper usable anywhere in client modules */
export function emitToast(message: string, variant: ToastVariant = "info") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("archeon:toast", { detail: { message, variant } })
    );
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );
  const error = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );
  const info = useCallback(
    (message: string) => showToast(message, "info"),
    [showToast]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{
        message?: string;
        variant?: ToastVariant;
      }>;
      if (custom.detail?.message) {
        showToast(custom.detail.message, custom.detail.variant ?? "info");
      }
    };
    window.addEventListener("archeon:toast", handler);
    return () => window.removeEventListener("archeon:toast", handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}

      {/* Architectural Editorial Toast Stack */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-5 left-4 right-4 z-[85] flex flex-col gap-2.5 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon =
              item.variant === "success"
                ? CheckCircle2
                : item.variant === "error"
                ? AlertCircle
                : Info;
            const accentClass =
              item.variant === "success"
                ? "border-[#B68A4A]/65 text-[#C6A779]"
                : item.variant === "error"
                ? "border-red-400/50 text-red-400"
                : "border-white/25 text-[#E0D8C3]";

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-[#11100E]/95 px-4 py-3.5 text-[#F2F0EB] shadow-[0_16px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl ${accentClass}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1 font-['Outfit',sans-serif] text-xs font-normal leading-relaxed text-[#F2F0EB]">
                  {item.message}
                </p>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 p-0.5 text-stone-400 transition-colors hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
