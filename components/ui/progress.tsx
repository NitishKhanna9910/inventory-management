import { cn } from "@/lib/utils";
import * as React from "react";

export function Progress({
  value = 0,
  className,
  indicatorClassName,
}: {
  value?: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
