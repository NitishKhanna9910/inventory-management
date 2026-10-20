"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import * as React from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border bg-card p-4 shadow-lg data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right",
  {
    variants: {
      variant: {
        default: "border-border",
        success: "border-emerald-200 bg-emerald-50/95 dark:border-emerald-500/30 dark:bg-emerald-950/90",
        error: "border-red-200 bg-red-50/95 dark:border-red-500/30 dark:bg-red-950/90",
        warning: "border-amber-200 bg-amber-50/95 dark:border-amber-500/30 dark:bg-amber-950/90",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const icons: Record<NonNullable<ToastItem["variant"]>, React.ReactNode> = {
  default: <Info className="mt-0.5 size-4 text-muted-foreground" />,
  success: <CheckCircle2 className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" />,
  error: <AlertCircle className="mt-0.5 size-4 text-red-600 dark:text-red-400" />,
  warning: <AlertTriangle className="mt-0.5 size-4 text-amber-600 dark:text-amber-400" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(1);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = idRef.current++;
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            data-state="open"
            className={cn(toastVariants({ variant: t.variant }))}
            role="status"
          >
            {icons[t.variant ?? "default"]}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{t.title}</p>
              {t.description ? (
                <p className="mt-1 text-xs leading-relaxed opacity-80">{t.description}</p>
              ) : null}
              {t.action ? (
                <button
                  type="button"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  {t.action.label}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 opacity-50 transition-opacity hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return {
    toast: ctx.push,
    success: (title: string, description?: string) => ctx.push({ title, description, variant: "success" }),
    error: (title: string, description?: string) => ctx.push({ title, description, variant: "error" }),
    warning: (title: string, description?: string) => ctx.push({ title, description, variant: "warning" }),
    info: (title: string, description?: string) => ctx.push({ title, description, variant: "default" }),
  };
}
