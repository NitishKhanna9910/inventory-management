"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { itemStock } from "@/lib/calculations";
import { recordWaste } from "@/lib/ops";
import { loadDB, sel, useStore, type StoreApi } from "@/lib/store";
import { WASTE_REASONS } from "@/lib/types";
import type { WasteReason } from "@/lib/types";
import { formatDate, formatMoneyShort, formatQty, sumBy } from "@/lib/utils";
import { AlertTriangle, Plus, Trash2, TrendingDown } from "lucide-react";
import * as React from "react";

export function WastePage() {
  const { db } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [outlet, setOutlet] = React.useState("all");
  const [form, setForm] = React.useState({
    itemId: "",
    outletId: db.outlets[0]?.id ?? "",
    qty: 0,
    reason: "Spoiled" as WasteReason,
    notes: "",
  });

  React.useEffect(() => {
    const fn = (e: Event) => setOutlet((e as CustomEvent<string>).detail);
    window.addEventListener("stockpilot:outlet", fn);
    return () => window.removeEventListener("stockpilot:outlet", fn);
  }, []);

  const rows = db.waste
    .filter((w) => (outlet === "all" ? true : w.outletId === outlet))
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const totalCost = sumBy(rows, (w) => w.cost);
  const thisMonth = rows.filter((w) => {
    const d = new Date(w.at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const reasonTotals = Object.entries(
    rows.reduce<Record<string, number>>((acc, w) => {
      acc[w.reason] = (acc[w.reason] ?? 0) + w.cost;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      recordWaste({ db: loadDB() } as StoreApi, {
        itemId: form.itemId,
        outletId: form.outletId,
        qty: form.qty,
        reason: form.reason,
        notes: form.notes,
      });
      toast({ title: "Waste recorded", description: "Stock reduced and waste log updated.", variant: "success" });
      setOpen(false);
      setForm({ ...form, itemId: "", qty: 0, notes: "" });
    } catch (err) {
      toast({ title: "Cannot record waste", description: String(err), variant: "error" });
    }
  };

  const itemOptions = db.items
    .filter((i) => i.status === "active" && i.outletIds.includes(form.outletId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedQty = form.itemId ? itemStock(db.balances, form.itemId, form.outletId) : 0;
  const selectedItem = db.items.find((i) => i.id === form.itemId);

  return (
    <div>
      <PageHeader
        title="Waste & Spoilage"
        description="Log what gets thrown away — every entry reduces stock and reports cost."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> Record waste
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Waste cost (all time)"
          value={formatMoneyShort(totalCost)}
          hint={`${rows.length} entries`}
          tone="danger"
          icon={<Trash2 className="size-4" />}
        />
        <MetricCard
          label="This month"
          value={formatMoneyShort(sumBy(thisMonth, (w) => w.cost))}
          hint={`${thisMonth.length} entries`}
          tone="warning"
          icon={<TrendingDown className="size-4" />}
        />
        <MetricCard
          label="Top reason"
          value={reasonTotals[0]?.[0] ?? "—"}
          hint={reasonTotals[0] ? formatMoneyShort(reasonTotals[0][1]) : "No waste yet"}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      {reasonTotals.length > 0 ? (
        <Card className="mb-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Waste by reason</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reasonTotals.map(([reason, cost]) => (
                <div key={reason} className="flex items-center gap-3">
                  <span className="w-40 text-xs">{reason}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${Math.max(3, (cost / (totalCost || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs tabular-nums">{formatMoneyShort(cost)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Waste log <span className="font-normal text-muted-foreground">({rows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(w) => w.id}
            pageSize={12}
            emptyState={
              <EmptyState
                icon={<Trash2 className="size-6" />}
                title="No waste recorded"
                description="Great job! When something spoils or is damaged, log it here so costs stay accurate."
                action={
                  <Button size="sm" onClick={() => setOpen(true)}>
                    <Plus className="size-3.5" /> Record waste
                  </Button>
                }
              />
            }
            columns={[
              {
                key: "date",
                header: "Date",
                sortValue: (w) => w.at,
                cell: (w) => <span className="text-xs tabular-nums">{formatDate(w.at)}</span>,
              },
              {
                key: "item",
                header: "Item",
                sortValue: (w) => sel.itemName(db, w.itemId),
                cell: (w) => (
                  <div>
                    <p className="text-sm font-medium">{sel.itemName(db, w.itemId)}</p>
                    <p className="text-[11px] text-muted-foreground">{sel.outletName(db, w.outletId)}</p>
                  </div>
                ),
              },
              {
                key: "qty",
                header: "Qty",
                align: "right",
                sortValue: (w) => w.qty,
                cell: (w) => (
                  <span className="text-sm tabular-nums">{formatQty(w.qty, sel.item(db, w.itemId)?.baseUnit)}</span>
                ),
              },
              {
                key: "reason",
                header: "Reason",
                sortValue: (w) => w.reason,
                cell: (w) => <span className="text-xs">{w.reason}</span>,
              },
              {
                key: "cost",
                header: "Cost",
                align: "right",
                sortValue: (w) => w.cost,
                cell: (w) => <span className="text-sm tabular-nums text-red-600">{formatMoneyShort(w.cost)}</span>,
              },
              {
                key: "by",
                header: "Recorded by",
                cell: (w) => <span className="text-xs text-muted-foreground">{w.recordedBy}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record waste</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Outlet / warehouse</Label>
              <Select value={form.outletId} onValueChange={(v) => setForm({ ...form, outletId: v, itemId: "" })}>
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
              <Label>Item</Label>
              <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick an item" />
                </SelectTrigger>
                <SelectContent>
                  {itemOptions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({formatQty(itemStock(db.balances, i.id, form.outletId), i.baseUnit)} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty">
                Quantity {selectedItem ? `(${selectedItem.baseUnit}) — ${formatQty(selectedQty, selectedItem.baseUnit)} available` : ""}
              </Label>
              <Input
                id="qty"
                type="number"
                min={0}
                step="0.001"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v as WasteReason })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WASTE_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Dropped tray of 6"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Record waste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
