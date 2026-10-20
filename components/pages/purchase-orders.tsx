"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PoStatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  computeLineTotals,
  computePOGrandTotals,
} from "@/lib/calculations";
import { createPurchaseOrder, updatePurchaseOrderStatus } from "@/lib/ops";
import { useStore } from "@/lib/store";
import type { PurchaseOrder } from "@/lib/types";
import { formatDateTime, formatMoneyShort } from "@/lib/utils";
import { Eye, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

const PO_STATUSES = [
  "all",
  "draft",
  "pending_approval",
  "approved",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
];

export function PurchaseOrdersPage() {
  const { db, update, reset } = useStore();
  const { error, success } = useToast();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const [supplierId, setSupplierId] = React.useState("");
  const [outletId, setOutletId] = React.useState(db.outlets[0]?.id ?? "");
  const [expectedDate, setExpectedDate] = React.useState(
    new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10)
  );
  const [lines, setLines] = React.useState([{ itemId: "", qty: 1, unitCost: 0 }]);

  const openStatuses = ["draft", "pending_approval", "approved", "ordered", "partially_received"];
  const pending = db.purchaseOrders.filter((po) => openStatuses.includes(po.status));
  const pendingValue = pending.reduce(
    (a, po) => a + computePOGrandTotals(po.lines.map(l => ({ qty: l.qtyOrdered, unitCost: l.unitCost, discountPct: l.discountPct, taxPct: l.taxPct }))).total,
    0
  );

  const rows = db.purchaseOrders
    .filter((po) => statusFilter === "all" || po.status === statusFilter)
    .filter((po) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        (db.suppliers.find((s) => s.id === po.supplierId)?.name ?? "")
          .toLowerCase()
          .includes(q)
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const onPickItem = (itemId: string, index: number) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const item = db.items.find((it) => it.id === itemId);
        return { ...l, itemId, unitCost: item?.purchasePrice ?? l.unitCost };
      })
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const po = createPurchaseOrder({ db, update, reset }, {
        supplierId,
        outletId,
        expectedDate,
        lines: lines.filter((l) => l.itemId && l.qty > 0),
      });
      success("PO created", po.poNumber);
      router.push(`/purchase-orders/${po.id}`);
      setOpen(false);
    } catch (err) {
      error(err instanceof Error ? err.message : "Could not create PO");
    }
  };

  const lineSubtotal = lines.reduce((a, l) => a + computeLineTotals(l).total, 0);

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Raise orders, track approvals and see what is still to arrive."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> New PO
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Open POs"
          value={pending.length}
          hint="Not yet fully received"
          icon={<ShoppingCart className="size-4" />}
        />
        <MetricCard
          label="Open value"
          value={formatMoneyShort(pendingValue)}
          hint="Committed spend"
        />
        <MetricCard
          label="Overdue"
          value={
            db.purchaseOrders.filter(
              (po) =>
                po.expectedDate < new Date().toISOString().slice(0, 10) &&
                !["received", "cancelled"].includes(po.status)
            ).length
          }
          hint="Past expected date"
        />
      </div>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-56 max-w-sm flex-1">
              <Input
                placeholder="Search PO number or supplier..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PO_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "all" : s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(po) => po.id}
            pageSize={12}
            emptyState={
              <EmptyState
                icon={<ShoppingCart className="size-6" />}
                title="No purchase orders"
                description="Create your first PO to restock an outlet."
              />
            }
            columns={[
              {
                key: "po",
                header: "PO",
                sortValue: (po) => po.poNumber,
                cell: (po) => (
                  <div>
                    <Link
                      href={`/purchase-orders/${po.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {po.poNumber}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateTime(po.createdAt)}
                    </p>
                  </div>
                ),
              },
              {
                key: "supplier",
                header: "Supplier",
                sortValue: (po) =>
                  db.suppliers.find((s) => s.id === po.supplierId)?.name ?? "",
                cell: (po) => (
                  <div>
                    <p className="text-sm">
                      {db.suppliers.find((s) => s.id === po.supplierId)?.name ?? "-"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Expected {po.expectedDate}
                    </p>
                  </div>
                ),
              },
              {
                key: "lines",
                header: "Lines",
                align: "right",
                cell: (po) => <span className="text-sm tabular-nums">{po.lines.length}</span>,
              },
              {
                key: "total",
                header: "Total",
                align: "right",
                sortValue: (po) => computePOGrandTotals(po.lines.map(l => ({ qty: l.qtyOrdered, unitCost: l.unitCost, discountPct: l.discountPct, taxPct: l.taxPct }))).total,
                cell: (po) => (
                  <span className="text-sm font-medium tabular-nums">
                    {formatMoneyShort(computePOGrandTotals(po.lines.map(l => ({ qty: l.qtyOrdered, unitCost: l.unitCost, discountPct: l.discountPct, taxPct: l.taxPct }))).total)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (po) => <PoStatusBadge status={po.status} />,
              },
              {
                key: "actions",
                header: "",
                cell: (po) => (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/purchase-orders/${po.id}`}>
                      <Eye className="size-3.5" /> View
                    </Link>
                  </Button>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New purchase order</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="po-supplier">Supplier</Label>
                <select
                  id="po-supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Select supplier...</option>
                  {db.suppliers
                    .filter((s) => s.active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-outlet">Deliver to</Label>
                <select
                  id="po-outlet"
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {db.outlets
                    .filter((o) => o.active)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="po-date">Expected date</Label>
                <Input
                  id="po-date"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Lines</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLines((p) => [...p, { itemId: "", qty: 1, unitCost: 0 }])
                  }
                >
                  <Plus className="size-3.5" /> Add line
                </Button>
              </div>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={l.itemId}
                      onChange={(e) => onPickItem(e.target.value, i)}
                      className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      <option value="">Select item...</option>
                      {db.items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.sku})
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={l.qty}
                      onChange={(e) =>
                        setLines((p) =>
                          p.map((x, j) =>
                            j === i ? { ...x, qty: Number(e.target.value) } : x
                          )
                        )
                      }
                      className="w-20"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={l.unitCost}
                      onChange={(e) =>
                        setLines((p) =>
                          p.map((x, j) =>
                            j === i ? { ...x, unitCost: Number(e.target.value) } : x
                          )
                        )
                      }
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-sm font-medium tabular-nums">
                Subtotal: {formatMoneyShort(lineSubtotal)}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create PO</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PurchaseOrderDetailPage({ id }: { id: string }) {
  const { db, update, reset } = useStore();
  const { error, info } = useToast();
  const po = db.purchaseOrders.find((p) => p.id === id);
  const [reason, setReason] = React.useState("");
  const [cancelOpen, setCancelOpen] = React.useState(false);

  if (!po) {
    return (
      <div>
        <PageHeader title="Purchase order not found" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            This PO does not exist (maybe it was deleted).{" "}
            <Link href="/purchase-orders" className="text-primary hover:underline">
              Back to purchase orders
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supplier = db.suppliers.find((s) => s.id === po.supplierId);
  const outlet = db.outlets.find((o) => o.id === po.outletId);
  const totals = computePOGrandTotals(po.lines.map(l => ({ qty: l.qtyOrdered, unitCost: l.unitCost, discountPct: l.discountPct, taxPct: l.taxPct })));

  const act = (status: PurchaseOrder["status"]) => {
    try {
      updatePurchaseOrderStatus({ db, update, reset },
        po.id,
        status,
        undefined,
        status === "cancelled" ? reason : undefined
      );
      info(`PO ${status.replace(/_/g, " ")}`);
      setCancelOpen(false);
    } catch (err) {
      error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const next: PurchaseOrder["status"][] =
    po.status === "draft"
      ? ["pending_approval", "approved", "cancelled"]
      : po.status === "pending_approval"
        ? ["approved", "cancelled"]
        : po.status === "approved"
          ? ["ordered", "cancelled"]
          : po.status === "ordered"
            ? ["partially_received", "received"]
            : po.status === "partially_received"
              ? ["received"]
              : [];

  return (
    <div>
      <PageHeader
        title={po.poNumber}
        description={`${supplier?.name ?? "Unknown supplier"} | ${outlet?.name ?? ""} | Expected ${po.expectedDate}`}
        actions={
          <div className="flex items-center gap-2">
            <PoStatusBadge status={po.status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/purchase-orders">All POs</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {next.map((s) =>
          s === "cancelled" ? (
            <Button key={s} size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
              Cancel PO
            </Button>
          ) : (
            <Button key={s} size="sm" onClick={() => act(s)}>
              {s === "pending_approval"
                ? "Send for approval"
                : s === "approved"
                  ? "Approve"
                  : s === "ordered"
                    ? "Mark ordered"
                    : "Mark " + s.replace(/_/g, " ")}
            </Button>
          )
        )}
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Order total"
          value={formatMoneyShort(totals.total)}
          hint={`Tax ${formatMoneyShort(totals.tax)}`}
        />
        <MetricCard
          label="Lines"
          value={po.lines.length}
          hint={`${po.receiptIds.length} receipt(s)`}
        />
        <MetricCard label="Created by" value={po.createdBy} hint={formatDateTime(po.createdAt)} />
      </div>

      <Card className="mb-5">
        <CardContent className="px-0">
          <DataTable
            rows={po.lines}
            rowKey={(l) => l.id}
            columns={[
              {
                key: "item",
                header: "Item",
                cell: (l) => db.items.find((i) => i.id === l.itemId)?.name ?? l.itemId,
              },
              { key: "ordered", header: "Ordered", align: "right", cell: (l) => l.qtyOrdered },
              { key: "received", header: "Received", align: "right", cell: (l) => l.qtyReceived },
              {
                key: "cost",
                header: "Unit cost",
                align: "right",
                cell: (l) => formatMoneyShort(l.unitCost),
              },
              {
                key: "total",
                header: "Total",
                align: "right",
                cell: (l) => (
                  <span className="tabular-nums">{formatMoneyShort(computeLineTotals({ qty: l.qtyOrdered, unitCost: l.unitCost, discountPct: l.discountPct, taxPct: l.taxPct }).total)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (l) => <span className="text-xs capitalize">{l.status}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-2 text-sm font-semibold">Status history</h3>
            <ol className="space-y-2">
              {po.statusHistory.map((h, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium capitalize">{h.status.replace(/_/g, " ")}</span>{" "}
                  <span className="text-muted-foreground">
                    - {formatDateTime(h.at)} - {h.by}
                  </span>
                  {h.note ? <p className="text-muted-foreground">{h.note}</p> : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-2 text-sm font-semibold">Notes</h3>
            <p className="text-sm text-muted-foreground">{po.notes || "No notes."}</p>
            {po.cancelReason ? (
              <p className="mt-3 text-sm text-red-600">Cancelled: {po.cancelReason}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel {po.poNumber}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="po-cancel-reason">Reason (required)</Label>
            <Input
              id="po-cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep PO
            </Button>
            <Button variant="destructive" onClick={() => act("cancelled")}>
              Cancel PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
