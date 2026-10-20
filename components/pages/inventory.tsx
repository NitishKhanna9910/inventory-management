"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { QuickStockDialog } from "@/components/shared/quick-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StockStatusBadge } from "@/components/ui/status-badge";
import {
  calculateInventoryValuation,
  generateReorderSuggestions,
  getStockStatus,
  itemStock,
} from "@/lib/calculations";
import { sel, useStore } from "@/lib/store";
import { downloadCsv, formatMoneyShort, formatQty, sumBy } from "@/lib/utils";
import { AlertTriangle, Download, Package, PackagePlus, PackageX, Plus, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export function StockOverviewPage() {
  const { db } = useStore();
  const [outlet, setOutlet] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [dialog, setDialog] = React.useState<null | "stock-in" | "stock-out" | "waste">(null);

  React.useEffect(() => {
    const fn = (e: Event) => setOutlet((e as CustomEvent<string>).detail);
    window.addEventListener("stockpilot:outlet", fn);
    return () => window.removeEventListener("stockpilot:outlet", fn);
  }, []);

  const scopedItems = db.items.filter((i) =>
    outlet === "all" ? true : i.outletIds.includes(outlet)
  );
  const scopedBalances =
    outlet === "all" ? db.balances : db.balances.filter((b) => b.outletId === outlet);

  const valuation = calculateInventoryValuation(scopedItems, scopedBalances);
  const reorder = generateReorderSuggestions(
    scopedItems,
    scopedBalances,
    db.movements,
    db.suppliers
  );

  const rows = scopedItems
    .map((item) => {
      const qty = itemStock(db.balances, item.id, outlet === "all" ? undefined : outlet);
      const statusKey = getStockStatus(qty, item.minStock);
      return { item, qty, statusKey };
    })
    .filter((r) => (category === "all" ? true : r.item.categoryId === category))
    .filter((r) => (status === "all" ? true : r.statusKey === status))
    .filter((r) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.item.name.toLowerCase().includes(q) ||
        r.item.sku.toLowerCase().includes(q) ||
        r.item.subcategory.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.item.name.localeCompare(b.item.name));

  const lowStock = rows.filter((r) => r.statusKey === "low").length;
  const outStock = rows.filter((r) => r.statusKey === "out").length;

  const exportCsv = () => {
    downloadCsv(
      "stock-overview.csv",
      ["SKU", "Item", "Category", "Qty", "Unit", "Avg Cost", "Value", "Min Stock", "Status"],
      rows.map((r) => [
        r.item.sku,
        r.item.name,
        sel.categoryName(db, r.item.categoryId),
        r.qty,
        r.item.baseUnit,
        r.item.avgCost,
        Math.round(r.qty * r.item.avgCost * 100) / 100,
        r.item.minStock,
        r.statusKey,
      ])
    );
  };

  return (
    <div>
      <PageHeader
        title="Stock Overview"
        description="Live stock position across every outlet and warehouse."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-3.5" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialog("waste")}>
              <PackageX className="size-3.5" /> Stock out
            </Button>
            <Button size="sm" onClick={() => setDialog("stock-in")}>
              <PackagePlus className="size-3.5" /> Stock in
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Inventory value"
          value={formatMoneyShort(valuation.totalValue)}
          hint={`${new Set(valuation.perItem.filter((p) => p.qty > 0.0001).map((p) => p.itemId)).size} items with stock`}
          icon={<Package className="size-4" />}
        />
        <MetricCard
          label="Items tracked"
          value={scopedItems.length}
          hint="Active + archived in scope"
        />
        <MetricCard
          label="Low stock items"
          value={lowStock}
          hint="Below minimum level"
          tone={lowStock > 0 ? "warning" : "default"}
          icon={<AlertTriangle className="size-4" />}
        />
        <MetricCard
          label="Out of stock"
          value={outStock}
          hint="Zero quantity on hand"
          tone={outStock > 0 ? "danger" : "default"}
          icon={<PackageX className="size-4" />}
        />
      </div>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or SKU…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="out">Out of stock</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Stock by item <span className="font-normal text-muted-foreground">({rows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(r) => r.item.id}
            pageSize={15}
            emptyState={
              <EmptyState
                icon={<Package className="size-6" />}
                title="No items match"
                description="Try clearing filters or add a new inventory item."
              />
            }
            columns={[
              {
                key: "item",
                header: "Item",
                sortValue: (r) => r.item.name,
                cell: (r) => (
                  <div>
                    <Link href={`/inventory/${r.item.id}`} className="text-sm font-medium hover:underline">
                      {r.item.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {r.item.sku} · {sel.categoryName(db, r.item.categoryId)}
                    </p>
                  </div>
                ),
              },
              {
                key: "qty",
                header: "On hand",
                align: "right",
                sortValue: (r) => r.qty,
                cell: (r) => (
                  <span className="text-sm font-medium tabular-nums">
                    {formatQty(r.qty, r.item.baseUnit)}
                  </span>
                ),
              },
              {
                key: "min",
                header: "Min",
                align: "right",
                sortValue: (r) => r.item.minStock,
                cell: (r) => (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatQty(r.item.minStock, r.item.baseUnit)}
                  </span>
                ),
              },
              {
                key: "value",
                header: "Value",
                align: "right",
                sortValue: (r) => r.qty * r.item.avgCost,
                cell: (r) => (
                  <span className="text-sm tabular-nums">
                    {formatMoneyShort(r.qty * r.item.avgCost)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (r) => <StockStatusBadge status={r.statusKey} />,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Reorder suggestions <span className="font-normal text-muted-foreground">({reorder.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reorder.length === 0 ? (
            <EmptyState
              icon={<Package className="size-6" />}
              title="Everything is adequately stocked"
              description="No items are below their reorder point right now."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reorder.slice(0, 9).map((s) => {
                const item = db.items.find((i) => i.id === s.itemId);
                if (!item) return null;
                return (
                  <div key={s.itemId} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Link href={`/inventory/${item.id}`} className="text-sm font-medium hover:underline">
                        {item.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        On hand {formatQty(s.currentStock, item.baseUnit)} · {s.urgency} urgency
                      </p>
                    </div>
                    <Link href="/purchase-orders/new">
                      <Button variant="outline" size="sm">
                        <Plus className="size-3.5" /> Order {formatQty(s.suggestedQty, item.baseUnit)}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <QuickStockDialog
        mode={dialog ?? "stock-in"}
        open={dialog !== null}
        onOpenChange={(v) => {
          if (!v) setDialog(null);
        }}
        defaultOutletId={outlet === "all" ? undefined : outlet}
      />
    </div>
  );
}
