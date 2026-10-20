"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-lg">
          <div className="flex gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                destructive ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
              )}
            >
              <AlertTriangle className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <DialogPrimitive.Title className="text-base font-semibold leading-tight">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
              {children}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={destructive ? "destructive" : "default"}
                  size="sm"
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading ? "Working…" : confirmLabel}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
