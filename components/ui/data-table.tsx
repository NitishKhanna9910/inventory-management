"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import * as React from "react";
import { Button } from "./button";

interface DataTableProps<T> {
  columns: Array<{
    key: string;
    header: React.ReactNode;
    cell: (row: T, index: number) => React.ReactNode;
    className?: string;
    sortValue?: (row: T) => string | number;
    align?: "left" | "right" | "center";
  }>;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  pageSize?: number;
  totalRows?: number;
  emptyState?: React.ReactNode;
  caption?: string;
  density?: "comfortable" | "compact";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  onRowClick,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  pageSize = 25,
  totalRows,
  emptyState,
  caption,
  density = "comfortable",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir, columns]);

  const total = totalRows ?? sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allKeys = paged.map((r, i) => rowKey(r, i));
  const allSelected = selectable && allKeys.length > 0 && allKeys.every((k) => selectedKeys.includes(k));

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(selectedKeys.filter((k) => !allKeys.includes(k)));
    } else {
      onSelectionChange(Array.from(new Set([...selectedKeys, ...allKeys])));
    }
  };

  const pad = density === "compact" ? "py-2" : "py-3";

  if (paged.length === 0 && emptyState) {
    return (
      <div className="rounded-lg border">
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full caption-bottom text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="sticky top-0 z-10 border-b bg-muted/60 backdrop-blur">
            <tr>
              {selectable ? (
                <th className="w-10 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="size-4 cursor-pointer accent-primary"
                  />
                </th>
              ) : null}
              {columns.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    className={cn(
                      "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className
                    )}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-foreground",
                          c.align === "right" && "flex-row-reverse"
                        )}
                      >
                        {c.header}
                        <ChevronRight
                          className={cn(
                            "size-3 transition-all",
                            active
                              ? "rotate-90 text-primary"
                              : "rotate-0 opacity-0"
                          )}
                        />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const key = rowKey(row, i);
              const selected = selectedKeys.includes(key);
              const cls = rowClassName?.(row);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b transition-colors last:border-0",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    selected && "bg-primary/[0.04]",
                    cls
                  )}
                >
                  {selectable ? (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          onSelectionChange?.(
                            selected
                              ? selectedKeys.filter((k) => k !== key)
                              : [...selectedKeys, key]
                          )
                        }
                        aria-label={`Select row ${key}`}
                        className="size-4 cursor-pointer accent-primary"
                      />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 align-middle",
                        pad,
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className
                      )}
                    >
                      {c.cell(row, i)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {total > pageSize ? (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setPage(1)} disabled={currentPage <= 1} aria-label="First page">
              <ChevronsLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            <span className="px-1 text-xs tabular-nums">{currentPage} / {totalPages}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage(totalPages)}
              disabled={currentPage >= totalPages}
              aria-label="Last page"
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
