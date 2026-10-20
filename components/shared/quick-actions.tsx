"use client";

import { useToast } from "@/components/ui/toast";
import { useStore, type StoreApi } from "@/lib/store";
import {
  recordManualStockIn,
  recordManualStockOut,
  recordWaste,
} from "@/lib/ops";
import { UNITS } from "@/lib/types";
import { formatQty } from "@/lib/utils";
import * as React from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

function ItemSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { db } = useStore();
  const [q, setQ] = React.useState("");
  const filtered = db.items
    .filter((i) => i.status === "active")
    .filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 60);
  return (
    <div className="space-y-1.5">
      <Input
        placeholder="Search item by name or SKU…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search items"
      />
      <div className="max-h-56 overflow-y-auto rounded-md border scrollbar-thin">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No items match.</p>
        ) : (
          filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => onChange(i.id)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors hover:bg-accent ${
                value === i.id ? "bg-primary/10 font-medium" : ""
              }`}
            >
              <span className="truncate">{i.name}</span>
              <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                {i.sku} · {i.baseUnit}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function QuickStockDialog({
  mode,
  open,
  onOpenChange,
  defaultItemId,
  defaultOutletId,
}: {
  mode: "stock-in" | "stock-out" | "waste";
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultItemId?: string;
  defaultOutletId?: string;
}) {
  const store = useStore();
  const { db } = store;
  const { success, error } = useToast();
  const [itemId, setItemId] = React.useState(defaultItemId ?? "");
  const [outletId, setOutletId] = React.useState(defaultOutletId ?? "");
  const [qty, setQty] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setItemId(defaultItemId ?? "");
      setOutletId(defaultOutletId ?? "");
      setQty("");
      setCost("");
      setReason("");
      setNotes("");
      setSaving(false);
    }
  }, [open, defaultItemId, defaultOutletId]);

  const item = db.items.find((i) => i.id === itemId);
  const balance = db.balances.find((b) => b.itemId === itemId && b.outletId === outletId);

  const titles = {
    "stock-in": "Record stock in",
    "stock-out": "Record stock out",
    waste: "Record waste / spoilage",
  } as const;

  const submit = () => {
    if (!itemId) return error("Select an item");
    if (!outletId) return error("Select an outlet");
    const n = parseFloat(qty);
    if (!Number.isFinite(n) || n <= 0) return error("Enter a quantity greater than zero");
    setSaving(true);
    try {
      if (mode === "stock-in") {
        recordManualStockIn(store as StoreApi, {
          itemId,
          outletId,
          qty: n,
          unitCost: cost ? parseFloat(cost) : undefined,
          notes,
        });
        success("Stock added", `${formatQty(n, item?.baseUnit)} of ${item?.name} added.`);
      } else if (mode === "stock-out") {
        recordManualStockOut(store as StoreApi, { itemId, outletId, qty: n, reason: notes });
        success("Stock removed", `${formatQty(n, item?.baseUnit)} of ${item?.name} removed.`);
      } else {
        if (!reason) {
          setSaving(false);
          return error("Select a waste reason");
        }
        recordWaste(store as StoreApi, {
          itemId,
          outletId,
          qty: n,
          reason: reason as never,
          notes,
        });
        success("Waste recorded", `${formatQty(n, item?.baseUnit)} of ${item?.name} written off.`);
      }
      onOpenChange(false);
    } catch (e) {
      error("Could not save", e instanceof Error ? e.message : "Unknown error");
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
          <DialogDescription>
            {mode === "waste"
              ? "Waste reduces available stock and posts a Waste movement in the ledger."
              : mode === "stock-in"
                ? "Adds quantity to the outlet balance and posts a Stock In movement."
                : "Deducts quantity from the outlet balance and posts a Stock Out movement."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Item</Label>
            <ItemSelect value={itemId} onChange={setItemId} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Outlet</Label>
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger><SelectValue placeholder="Select outlet" /></SelectTrigger>
                <SelectContent>
                  {db.outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity {item ? `(${item.baseUnit})` : ""}</Label>
              <Input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
            </div>
          </div>
          {item && outletId ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Current stock: <span className="font-semibold text-foreground">{formatQty(balance?.qty ?? 0, item.baseUnit)}</span>
              {" · "}Average cost: <span className="font-semibold text-foreground">₹{(balance?.avgCost || item.avgCost).toFixed(2)}</span>
            </p>
          ) : null}
          {mode === "stock-in" ? (
            <div>
              <Label>Unit cost (optional, per {item?.baseUnit ?? "unit"})</Label>
              <Input type="number" min="0" step="any" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Leave blank to use average cost" />
            </div>
          ) : null}
          {mode === "waste" ? (
            <div>
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {["Expired", "Spoiled", "Preparation Waste", "Overproduction", "Spillage", "Damaged Packaging", "Staff Consumption", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div>
            <Label>Notes {mode === "stock-out" ? "(reason)" : "(optional)"}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : mode === "waste" ? "Record waste" : mode === "stock-in" ? "Add stock" : "Remove stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export { UNITS };
