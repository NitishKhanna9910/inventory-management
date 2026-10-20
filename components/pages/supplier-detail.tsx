"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PoStatusBadge } from "@/components/ui/status-badge";
import { useStore } from "@/lib/store";
import { computePOGrandTotals } from "@/lib/calculations";
import { formatDateTime, formatMoneyShort } from "@/lib/utils";
import { Truck } from "lucide-react";
import Link from "next/link";

export function SupplierDetailPage({ id }: { id: string }) {
  const { db } = useStore();
  const s = db.suppliers.find((x) => x.id === id);

  if (!s) {
    return (
      <div>
        <PageHeader title="Supplier not found" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Link href="/suppliers" className="text-primary hover:underline">
              Back to suppliers
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pos = db.purchaseOrders
    .filter((p) => p.supplierId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const invoices = db.invoices.filter((i) => i.supplierId === id);
  const items = db.items.filter((i) => i.preferredSupplierId === id);
  const openValue = pos
    .filter((p) => !["received", "cancelled"].includes(p.status))
    .reduce((a, p) => a + computePOGrandTotals(p.lines.map(l => ({ qty: l.qtyOrdered, unitCost: l.unitCost, discountPct: l.discountPct, taxPct: l.taxPct }))).total, 0);

  return (
    <div>
      <PageHeader
        title={s.name}
        description={`${s.code} · ${s.contactPerson || "—"} · ${s.phone || "—"}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/suppliers">All suppliers</Link>
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <MetricCard label="On-time rate" value={`${s.onTimePct}%`} />
        <MetricCard label="Avg delivery" value={`${s.avgDeliveryDays} days`} />
        <MetricCard label="Payment terms" value={s.paymentTerms} hint={`${s.leadTimeDays}d lead time`} />
        <MetricCard label="Open order value" value={formatMoneyShort(openValue)} icon={<Truck className="size-4" />} />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-2 text-sm font-semibold">Contact</h3>
            <p className="text-sm">{s.contactPerson || "—"}</p>
            <p className="text-sm">{s.phone || "—"}</p>
            <p className="text-sm">{s.email || "—"}</p>
            <p className="text-sm">{s.address || "—"}</p>
            <p className="text-sm">GSTIN: {s.gstin || "—"}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <h3 className="mb-2 text-sm font-semibold">Preferred items</h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items prefer this supplier.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {items.map((i) => (
                  <span key={i.id} className="rounded-full border px-2.5 py-1 text-xs">
                    {i.name}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="px-0">
            <h3 className="px-5 pb-3 pt-5 text-sm font-semibold">Purchase orders</h3>
            <DataTable
              rows={pos}
              rowKey={(p) => p.id}
              pageSize={8}
              emptyState={
                <EmptyState
                  icon={<Truck className="size-6" />}
                  title="No POs"
                  description="Raise a PO from the Purchase Orders page."
                />
              }
              columns={[
                {
                  key: "po",
                  header: "PO",
                  cell: (p) => (
                    <Link href={`/purchase-orders/${p.id}`} className="text-sm font-medium hover:underline">
                      {p.poNumber}
                    </Link>
                  ),
                },
                { key: "date", header: "Date", cell: (p) => formatDateTime(p.createdAt) },
                {
                  key: "total",
                  header: "Total",
                  align: "right",
                  cell: (p) =>
                    formatMoneyShort(
                      computePOGrandTotals(
                        p.lines.map((l) => ({ qty: l.qtyOrdered, unitCost: l.unitCost, discountPct: l.discountPct, taxPct: l.taxPct }))
                      ).total
                    ),
                },
                { key: "status", header: "Status", cell: (p) => <PoStatusBadge status={p.status} /> },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-0">
            <h3 className="px-5 pb-3 pt-5 text-sm font-semibold">Invoices</h3>
            <DataTable
              rows={invoices}
              rowKey={(i) => i.id}
              pageSize={8}
              emptyState={
                <EmptyState
                  icon={<Truck className="size-6" />}
                  title="No invoices"
                  description="Supplier invoices appear here."
                />
              }
              columns={[
                { key: "number", header: "Invoice", cell: (i) => i.invoiceNumber },
                { key: "due", header: "Due", cell: (i) => i.dueDate },
                { key: "total", header: "Total", align: "right", cell: (i) => formatMoneyShort(i.total) },
                { key: "balance", header: "Balance", align: "right", cell: (i) => formatMoneyShort(i.total - i.paid) },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
