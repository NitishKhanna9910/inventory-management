"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { itemStock } from "@/lib/calculations";
import { loadDB, sel, useStore, type StoreApi } from "@/lib/store";
import { finalizeStockCount } from "@/lib/ops";
import type { StockCount, StockCountLine } from "@/lib/types";
import { formatDate, formatQty, nextSeq, round3, uid } from "@/lib/utils";
import { ClipboardCheck, ClipboardList, Plus } from "lucide-react";
import * as React from "react";

export function StockCountsPage() {
  const { db, update } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [outletId, setOutletId] = React.useState(db.outlets[0]?.id ?? "");
  const [categoryId, setCategoryId] = React.useState("all");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const sorted = [...db.counts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const active = db.counts.find((c) => c.id === activeId) ?? null;

  const startCount = () => {
    const items = db.items.filter(
      (i) =>
        i.status === "active" &&
        i.outletIds.includes(outletId) &&
        (categoryId === "all" || i.categoryId === categoryId)
    );
    if (items.length === 0) {
      toast({ title: "Nothing to count", description: "No items match this outlet/category.", variant: "warning" });
      return;
    }
    const lines: StockCountLine[] = items.map((i) => ({
      itemId: i.id,
      expected: itemStock(db.balances, i.id, outletId),
      counted: null,
      variance: 0,
      note: "",
    }));
    const count: StockCount = {
      id: uid("cnt"),
      countNumber: nextSeq("CNT", db.counts.map((c) => c.countNumber)),
      outletId,
      categoryIds: categoryId === "all" ? [] : [categoryId],
      status: "draft",
      createdAt: new Date().toISOString(),
      createdBy: "Demo User",
      lines,
    };
    update((draft) => ({ ...draft, counts: [count, ...draft.counts] }));
    setActiveId(count.id);
    setOpen(false);
    toast({ title: "Count started", description: `${count.countNumber} · ${lines.length} items`, variant: "success" });
  };

  const setCounted = (countId: string, itemId: string, value: string) => {
    const num = value === "" ? null : Number(value);
    update((draft) => ({
      ...draft,
      counts: draft.counts.map((c) =>
        c.id !== countId
          ? c
          : {
              ...c,
              lines: c.lines.map((l) =>
                l.itemId !== itemId
                  ? l
                  : { ...l, counted: num, variance: num === null ? 0 : round3(num - l.expected) }
              ),
            }
      ),
    }));
  };

  const finalize = (countId: string) => {
    try {
      finalizeStockCount({ db: loadDB(), update } as StoreApi, countId);
      toast({ title: "Count finalized", description: "Stock adjustments have been posted to the ledger.", variant: "success" });
      setConfirmId(null);
      setActiveId(null);
    } catch (err) {
      toast({ title: "Cannot finalize", description: String(err), variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Stock Counts"
        description="Physical counts with variance tracking — adjustments post only on finalize."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Start count
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Counts recorded"
          value={db.counts.length}
          hint="All time"
          icon={<ClipboardList className="size-4" />}
        />
        <MetricCard
          label="Draft counts"
          value={db.counts.filter((c) => c.status === "draft").length}
          hint="Awaiting finalize"
          tone="warning"
        />
        <MetricCard
          label="Finalized"
          value={db.counts.filter((c) => c.status === "finalized").length}
          hint="Adjustments posted"
          tone="success"
          icon={<ClipboardCheck className="size-4" />}
        />
      </div>

      {active ? (
        <Card className="mb-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {active.countNumber} · {sel.outletName(db, active.outletId)}{" "}
              <span className="font-normal text-muted-foreground">— enter counted quantities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <DataTable
              rows={active.lines}
              rowKey={(l) => l.itemId}
              pageSize={20}
              columns={[
                {
                  key: "item",
                  header: "Item",
                  sortValue: (l) => sel.itemName(db, l.itemId),
                  cell: (l) => (
                    <div>
                      <p className="text-sm font-medium">{sel.itemName(db, l.itemId)}</p>
                      <p className="text-[11px] text-muted-foreground">{sel.item(db, l.itemId)?.sku}</p>
                    </div>
                  ),
                },
                {
                  key: "expected",
                  header: "System qty",
                  align: "right",
                  sortValue: (l) => l.expected,
                  cell: (l) => (
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatQty(l.expected, sel.item(db, l.itemId)?.baseUnit)}
                    </span>
                  ),
                },
                {
                  key: "counted",
                  header: "Counted",
                  align: "right",
                  cell: (l) => (
                    <Input
                      type="number"
                      step="0.001"
                      min={0}
                      value={l.counted ?? ""}
                      onChange={(e) => setCounted(active.id, l.itemId, e.target.value)}
                      className="h-8 w-28 text-right tabular-nums"
                      placeholder="—"
                    />
                  ),
                },
                {
                  key: "variance",
                  header: "Variance",
                  align: "right",
                  sortValue: (l) => l.variance,
                  cell: (l) => (
                    <span
                      className={
                        "text-sm tabular-nums " +
                        (l.variance === 0
                          ? "text-muted-foreground"
                          : l.variance > 0
                            ? "text-emerald-600"
                            : "text-red-600")
                      }
                    >
                      {l.variance > 0 ? "+" : ""}
                      {formatQty(l.variance, sel.item(db, l.itemId)?.baseUnit)}
                    </span>
                  ),
                },
              ]}
            />
            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" size="sm" onClick={() => setActiveId(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmId(active.id)}
                disabled={active.lines.some((l) => l.counted === null)}
              >
                <ClipboardCheck className="size-3.5" /> Finalize count
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Count history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <DataTable
            rows={sorted}
            rowKey={(c) => c.id}
            emptyState={
              <EmptyState
                icon={<ClipboardList className="size-6" />}
                title="No counts yet"
                description="Start a physical count to compare system stock with what is actually on the shelf."
                action={
                  <Button size="sm" onClick={() => setOpen(true)}>
                    <Plus className="size-3.5" /> Start count
                  </Button>
                }
              />
            }
            columns={[
              {
                key: "num",
                header: "Count",
                sortValue: (c) => c.countNumber,
                cell: (c) => (
                  <div>
                    <p className="text-sm font-medium">{c.countNumber}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(c.createdAt)}</p>
                  </div>
                ),
              },
              { key: "outlet", header: "Outlet", sortValue: (c) => sel.outletName(db, c.outletId), cell: (c) => <span className="text-sm">{sel.outletName(db, c.outletId)}</span> },
              { key: "lines", header: "Lines", align: "right", sortValue: (c) => c.lines.length, cell: (c) => <span className="text-sm tabular-nums">{c.lines.length}</span> },
              {
                key: "variance",
                header: "Variances",
                align: "right",
                sortValue: (c) => c.lines.filter((l) => Math.abs(l.variance) > 0.0001).length,
                cell: (c) => (
                  <span className="text-sm tabular-nums">
                    {c.lines.filter((l) => Math.abs(l.variance) > 0.0001).length}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (c) =>
                  c.status === "finalized" ? (
                    <StatusBadge variant="success">Finalized</StatusBadge>
                  ) : (
                    <StatusBadge variant="warning">Draft</StatusBadge>
                  ),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (c) =>
                  c.status === "draft" ? (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveId(c.id)}>
                        Resume
                      </Button>
                      <Button size="sm" onClick={() => setConfirmId(c.id)} disabled={c.lines.some((l) => l.counted === null)}>
                        Finalize
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{formatDate(c.finalizedAt)}</span>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start a stock count</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Outlet / warehouse</Label>
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {db.outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category scope</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {db.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={startCount}>Start count</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(v) => {
          if (!v) setConfirmId(null);
        }}
        title="Finalize stock count?"
        description="All variances will be posted as stock adjustments. The count will lock and can no longer be edited."
        confirmLabel="Finalize"
        onConfirm={() => confirmId && finalize(confirmId)}
      />
    </div>
  );
}
