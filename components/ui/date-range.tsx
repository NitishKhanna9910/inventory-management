"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

interface DateRangeInputProps {
  from?: string;
  to?: string;
  onChange: (from: string, to: string) => void;
  className?: string;
  presets?: boolean;
}

export function DateRangeInput({
  from = "",
  to = "",
  onChange,
  className,
  presets = true,
}: DateRangeInputProps) {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return format(d, "yyyy-MM-dd");
  };
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className={cn("flex flex-wrap items-end gap-2", className)}>
      {presets ? (
        <div className="flex flex-wrap gap-1">
          {[
            { label: "7D", days: 7 },
            { label: "30D", days: 30 },
            { label: "90D", days: 90 },
          ].map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => onChange(daysAgo(p.days), today)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-1">
        <Label className="text-[11px] text-muted-foreground">From</Label>
        <div className="relative">
          <Input
            type="date"
            value={from}
            onChange={(e) => onChange(e.target.value, to)}
            className="h-8 w-[150px] text-xs"
          />
        </div>
      </div>
      <div className="grid gap-1">
        <Label className="text-[11px] text-muted-foreground">To</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="h-8 w-[150px] text-xs"
        />
      </div>
      {from && to ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => onChange("", "")}
        >
          <CalendarIcon className="size-3.5" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
