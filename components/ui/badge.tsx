import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        success: "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning: "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        destructive: "border-transparent bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        info: "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        purple: "border-transparent bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        slate: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
