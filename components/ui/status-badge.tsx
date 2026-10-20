import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        info: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        destructive: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        purple: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        slate: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
        teal: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  dotColor?: string;
}

export function StatusBadge({ className, variant = "default", dotColor, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      <span
        className={cn("size-1.5 rounded-full", dotColor ?? "bg-current")}
        aria-hidden
      />
      {children}
    </span>
  );
}

const stockStatusVariant: Record<string, "destructive" | "warning" | "success"> = {
  out: "destructive",
  low: "warning",
  healthy: "success",
};

const stockStatusLabel: Record<string, string> = {
  out: "Out of Stock",
  low: "Low Stock",
  healthy: "Healthy",
};

export function StockStatusBadge({ status }: { status: "healthy" | "low" | "out" }) {
  return (
    <StatusBadge variant={stockStatusVariant[status]}>
      {stockStatusLabel[status]}
    </StatusBadge>
  );
}

const poStatusVariant: Record<string, "slate" | "warning" | "info" | "purple" | "teal" | "success" | "destructive"> = {
  draft: "slate",
  pending_approval: "warning",
  approved: "info",
  ordered: "purple",
  partially_received: "teal",
  received: "success",
  cancelled: "destructive",
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  ordered: "Ordered",
  partially_received: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

export function PoStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge variant={poStatusVariant[status] ?? "default"}>
      {PO_STATUS_LABELS[status] ?? status}
    </StatusBadge>
  );
}

const transferStatusVariant: Record<string, "slate" | "info" | "purple" | "success" | "destructive"> = {
  draft: "slate",
  pending: "info",
  approved: "purple",
  dispatched: "purple",
  received: "success",
  cancelled: "destructive",
};

export const TRANSFER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending Approval",
  approved: "Approved",
  dispatched: "Dispatched",
  received: "Received",
  cancelled: "Cancelled",
};

export function TransferStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge variant={transferStatusVariant[status] ?? "default"}>
      {TRANSFER_STATUS_LABELS[status] ?? status}
    </StatusBadge>
  );
}

const invoiceStatusVariant: Record<string, "destructive" | "warning" | "info" | "success"> = {
  unpaid: "info",
  partially_paid: "warning",
  paid: "success",
  overdue: "destructive",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge variant={invoiceStatusVariant[status] ?? "default"}>
      {INVOICE_STATUS_LABELS[status] ?? status}
    </StatusBadge>
  );
}
