"use client";

import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/layout/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import {
  calculateInventoryValuation,
  generateReorderSuggestions,
} from "@/lib/calculations";
import { downloadCsv, formatMoneyShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ReportsPage() {
  const { db } = useStore();
  const val = calculateInventoryValuation(db.items, db.balances);
  const suggestions = generateReorderSuggestions(
    db.items,
    db.balances,
    db.movements,
    db.suppliers
  );

  const wasteCost = db.waste.reduce((a, w) => a + w.cost, 0);

  const topValue = val.perItem
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((r) => ({
      name: db.items.find((i) => i.id === r.itemId)?.name ?? r.itemId,
      value: Math.round(r.value),
    }));

  const exportInventory = () =>
    downloadCsv(
      "inventory-valuation.csv",
      ["SKU", "Item", "Qty", "Unit", "Avg cost", "Value"],
      val.perItem.map((r) => {
        const item = db.items.find((i) => i.id === r.itemId);
        return [item?.sku ?? "", item?.name ?? "", String(r.qty), item?.baseUnit ?? "", String(item?.avgCost ?? 0), String(r.value)];
      })
    );

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Stock valuation, spend and waste at a glance."
        actions={
          <Button size="sm" variant="outline" onClick={exportInventory}>
            <Download className="size-3.5" /> Export inventory CSV
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <MetricCard label="Total value" value={formatMoneyShort(val.totalValue)} hint="Weighted average" />
        <MetricCard label="Waste cost" value={formatMoneyShort(wasteCost)} hint="All recorded waste" />
        <MetricCard
          label="Reorder items"
          value={suggestions.length}
          hint="Suggested to restock"
        />
        <MetricCard label="Active SKUs" value={db.items.filter((i) => i.status === "active").length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-3 text-sm font-semibold">Top items by stock value</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topValue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatMoneyShort(Number(v))} />
                <Bar dataKey="value" fill="var(--chart-1, #6366f1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-3 text-sm font-semibold">Value by outlet</h3>
            <div className="space-y-3">
              {val.perOutlet.map((o) => (
                <div key={o.outletId} className="flex items-center justify-between">
                  <span className="text-sm">
                    {db.outlets.find((x) => x.id === o.outletId)?.name ?? o.outletId}
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatMoneyShort(o.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
