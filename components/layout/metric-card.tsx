import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  delta,
  deltaLabel,
  tone = "default",
  className,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  delta?: number;
  deltaLabel?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
  href?: string;
}) {
  const toneCls = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    danger: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
    info: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  }[tone];

  const Wrapper = href ? "a" : "div";

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          {icon ? (
            <span className={cn("flex size-8 items-center justify-center rounded-lg", toneCls)}>
              {icon}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <div className="mt-1 flex items-center gap-1.5">
          {typeof delta === "number" && delta !== 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-medium",
                delta >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
          {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        {deltaLabel ? <p className="mt-0.5 text-[10px] text-muted-foreground">{deltaLabel}</p> : null}
        {href ? <Wrapper href={href} className="absolute inset-0" aria-label={`Open ${label}`} /> : null}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-4 py-14 text-center", className)}>
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
