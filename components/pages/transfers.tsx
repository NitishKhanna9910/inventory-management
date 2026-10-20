"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { TransferStatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  dispatchStockTransfer,
  receiveStockTransfer,
} from "@/lib/ops";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import { Truck } from "lucide-react";
import Link from "next/link";

export function TransfersPage() {
  const { db, update, reset } = useStore();
  const { error, info } = useToast();

  const rows = [...db.transfers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const dispatch = (id: string) => {
    try {
      dispatchStockTransfer({ db, update, reset }, id);
      info("Transfer dispatched — stock deducted at source");
    } catch (err) {
      error(err instanceof Error ? err.message : "Dispatch failed");
    }
  };

  const receive = (id: string) => {
    try {
      const tr = db.transfers.find((t) => t.id === id);
      receiveStockTransfer(
        { db, update, reset },
        id,
        (tr?.lines ?? []).map((l) => ({
          itemId: l.itemId,
          receivedQty: l.qty,
          damagedQty: 0,
        }))
      );
      info("Transfer received — stock added at destination");
    } catch (err) {
      error(err instanceof Error ? err.message : "Receipt failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Stock Transfers"
        description="Move stock between locations. Deducted on dispatch, added on receipt."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Pending / draft"
          value={db.transfers.filter((t) => ["draft", "pending", "approved"].includes(t.status)).length}
          hint="Not yet dispatched"
        />
        <MetricCard
          label="In transit"
          value={db.transfers.filter((t) => t.status === "dispatched").length}
          hint="Dispatched, awaiting receipt"
        />
        <MetricCard
          label="Received"
          value={db.transfers.filter((t) => t.status === "received").length}
          hint="Completed"
        />
      </div>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(t) => t.id}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={<Truck className="size-6" />}
                title="No transfers"
                description="Stock transfers between outlets will appear here."
              />
            }
            columns={[
              {
                key: "number",
                header: "Transfer",
                cell: (t) => (
                  <div>
                    <p className="text-sm font-medium">{t.transferNumber}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateTime(t.createdAt)}
                    </p>
                  </div>
                ),
              },
              {
                key: "route",
                header: "Route",
                cell: (t) => (
                  <span className="text-xs">
                    {db.outlets.find((o) => o.id === t.fromOutletId)?.name ?? t.fromOutletId} →{" "}
                    {db.outlets.find((o) => o.id === t.toOutletId)?.name ?? t.toOutletId}
                  </span>
                ),
              },
              {
                key: "lines",
                header: "Lines",
                align: "right",
                cell: (t) => t.lines.length,
              },
              {
                key: "status",
                header: "Status",
                cell: (t) => <TransferStatusBadge status={t.status} />,
              },
              {
                key: "actions",
                header: "",
                cell: (t) =>
                  ["draft", "pending", "approved"].includes(t.status) ? (
                    <Button size="sm" variant="outline" onClick={() => dispatch(t.id)}>
                      Dispatch
                    </Button>
                  ) : t.status === "dispatched" ? (
                    <Button size="sm" onClick={() => receive(t.id)}>
                      Receive
                    </Button>
                  ) : (
                    <Link href="/stock-movements" className="text-xs text-primary hover:underline">
                      View movements
                    </Link>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
