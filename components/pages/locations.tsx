"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatMoneyShort } from "@/lib/utils";
import { Warehouse } from "lucide-react";
import Link from "next/link";

export function LocationsPage() {
  const { db } = useStore();

  const valueByOutlet = new Map<string, number>();
  for (const it of db.items) {
    for (const b of db.balances) {
      if (b.itemId !== it.id) continue;
      valueByOutlet.set(
        b.outletId,
        (valueByOutlet.get(b.outletId) ?? 0) + b.qty * it.avgCost
      );
    }
  }

  const zones = Array.from(new Set(db.storageLocations.map((l) => l.zone)));

  return (
    <div>
      <PageHeader
        title="Locations & Warehouses"
        description="Outlets, warehouse and the storage zones inside each."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Outlets"
          value={db.outlets.filter((o) => o.type === "outlet").length}
          hint="Front-of-house locations"
        />
        <MetricCard
          label="Warehouses"
          value={db.outlets.filter((o) => o.type === "warehouse").length}
          hint="Central storage"
          icon={<Warehouse className="size-4" />}
        />
        <MetricCard label="Storage zones" value={zones.length} hint="Across all locations" />
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {db.outlets.map((o) => (
          <Card key={o.id}>
            <CardContent className="pt-5">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <Link
                    href={`/locations/${o.id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {o.name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {o.code} · {o.type}
                  </p>
                </div>
                {o.active ? (
                  <StatusBadge variant="success">Active</StatusBadge>
                ) : (
                  <StatusBadge variant="slate">Inactive</StatusBadge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{o.address}</p>
              <p className="mt-2 text-xs">
                Manager: <span className="font-medium">{o.manager}</span>
              </p>
              <p className="text-xs">
                Stock value:{" "}
                <span className="font-medium tabular-nums">
                  {formatMoneyShort(valueByOutlet.get(o.id) ?? 0)}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 text-sm font-semibold">Storage zones</h3>
          <DataTable
            rows={db.storageLocations}
            rowKey={(l) => l.id}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={<Warehouse className="size-6" />}
                title="No storage locations"
                description="Storage zones will appear here."
              />
            }
            columns={[
              { key: "name", header: "Zone", sortValue: (l) => l.name, cell: (l) => l.name },
              { key: "zone", header: "Type", cell: (l) => l.zone },
              {
                key: "outlet",
                header: "Location",
                cell: (l) => db.outlets.find((o) => o.id === l.outletId)?.name ?? "—",
              },
              {
                key: "items",
                header: "Items here",
                align: "right",
                cell: (l) =>
                  db.items.filter((i) => i.storageLocationId === l.id).length,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function LocationDetailPage({ id }: { id: string }) {
  const { db } = useStore();
  const outlet = db.outlets.find((o) => o.id === id);

  if (!outlet) {
    return (
      <div>
        <PageHeader title="Location not found" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Link href="/locations" className="text-primary hover:underline">
              Back to locations
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const zones = db.storageLocations.filter((l) => l.outletId === id);

  return (
    <div>
      <PageHeader
        title={outlet.name}
        description={`${outlet.code} · ${outlet.type} · ${outlet.address}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/locations">All locations</Link>
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Manager" value={outlet.manager} />
        <MetricCard label="Phone" value={outlet.phone || "—"} />
        <MetricCard label="Storage zones" value={zones.length} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 text-sm font-semibold">Storage zones</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {zones.map((z) => (
              <div key={z.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{z.name}</p>
                <p className="text-[11px] text-muted-foreground">{z.zone}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
