"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "./button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className={cn("flex items-center justify-between gap-2 px-1", className)}>
      {total !== undefined ? (
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages} · {total} records
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <span className="px-2 text-xs font-medium tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function usePagination(total: number, pageSize: number) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const slice = React.useCallback(
    <T,>(rows: T[]) => rows.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize]
  );
  return { page, setPage, totalPages, slice };
}
