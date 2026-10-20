"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PoStatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { updatePurchaseOrderStatus } from "@/lib/ops";
import { useStore } from "@/lib/store";
import { formatDateTime, formatMoneyShort } from "@/lib/utils";
import { PackageOpen } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export function ReceivingPage() {
  const { db, update } = useStore();
  const { error, info } = useToast();
  const [selected, setSelected] = React.useState<string | null>(null);

  const receiveable = db.purchaseOrders.filter((po) =>
    ["approved", "ordered", "partially_received"].includes(po.status)
  );
  const receipts = [...db.receipts].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  const markOrdered = (poId: string) => {
    try {
      updatePurchaseOrderStatus({ db, update, reset: () => {} }, poId, "ordered");
      info("PO marked as ordered");
    } catch (err) {
      error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const po = receiveable.find((p) => p.id === selected) ?? receiveable[0];

  return (
    <div>
      <PageHeader
        title="Goods Receiving"
        description="Book deliveries against approved POs. Stock increases only by the accepted quantity."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <h3 className="mb-3 text-sm font-semibold">POs ready to receive</h3>
            {receiveable.length === 0 ? (
              <EmptyState
                icon={<PackageOpen className="size-6" />}
                title="Nothing to receive"
                description="No POs are awaiting delivery right now."
              />
            ) : (
              <div className="space-y-2">
                {receiveable.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
                      po?.id === p.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{p.poNumber}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {db.suppliers.find((s) => s.id === p.supplierId)?.name} ·{" "}
                        {p.lines.length} lines
                      </p>
                    </div>
                    <div className="text-right">
                      <PoStatusBadge status={p.status} />
                      {p.status === "approved" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markOrdered(p.id);
                          }}
                          className="mt-1 block w-full rounded border px-2 py-0.5 text-[11px] hover:bg-muted"
                        >
                          Mark ordered
                        </button>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <h3 className="mb-1 text-sm font-semibold">
              {po ? `Receive against ${po.poNumber}` : "Select a PO"}
            </h3>
            {po ? (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  Full receiving with accepted/damaged quantities lives on the PO page for this
                  demo — open the PO and use the receiving flow there.
                </p>
                <Button asChild size="sm">
                  <Link href={`/purchase-orders/${po.id}`}>
                    <PackageOpen className="size-3.5" /> Open PO to receive
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing selected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardContent className="pt-5">
          <h3 className="mb-3 text-sm font-semibold">Recent receipts (GRN history)</h3>
          <DataTable
            rows={receipts}
            rowKey={(r) => r.id}
            pageSize={8}
            emptyState={
              <EmptyState
                icon={<PackageOpen className="size-6" />}
                title="No receipts yet"
                description="Receive a delivery to build GRN history."
              />
            }
            columns={[
              {
                key: "grn",
                header: "GRN",
                cell: (r) => (
                  <div>
                    <p className="text-sm font-medium">{r.grnNumber}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {db.purchaseOrders.find((p) => p.id === r.poId)?.poNumber ?? "—"}
                    </p>
                  </div>
                ),
              },
              {
                key: "supplier",
                header: "Supplier",
                cell: (r) => db.suppliers.find((s) => s.id === r.supplierId)?.name ?? "—",
              },
              {
                key: "lines",
                header: "Lines",
                align: "right",
                cell: (r) => r.lines.length,
              },
              {
                key: "value",
                header: "Accepted value",
                align: "right",
                cell: (r) =>
                  formatMoneyShort(r.lines.reduce((a, l) => a + l.acceptedQty * l.unitCost, 0)),
              },
              {
                key: "at",
                header: "Received at",
                cell: (r) => formatDateTime(r.receivedAt),
              },
              { key: "by", header: "By", cell: (r) => r.receivedBy },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
