"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StockStatusBadge } from "@/components/ui/status-badge";
import { generateReorderSuggestions } from "@/lib/calculations";
import { useStore } from "@/lib/store";
import { formatMoneyShort } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export function ForecastingPage() {
  const { db } = useStore();
  const suggestions = generateReorderSuggestions(
    db.items,
    db.balances,
    db.movements,
    db.suppliers
  );

  const stockouts = suggestions.filter((s) => s.daysRemaining <= 3);

  return (
    <div>
      <PageHeader
        title="Demand Forecasting"
        description="Based on recent consumption — what will run out soon and how much to reorder."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Forecast model"
          value="30-day usage"
          hint="Rolling average consumption"
          icon={<TrendingUp className="size-4" />}
        />
        <MetricCard
          label="At risk of stockout"
          value={stockouts.length}
          hint="≤3 days of stock"
        />
        <MetricCard
          label="Reorder suggestions"
          value={suggestions.length}
          hint="Ready to convert to POs"
        />
      </div>

      <Card>
        <CardContent className="px-0">
          <h3 className="px-5 pb-3 pt-5 text-sm font-semibold">Suggested purchase quantities</h3>
          <DataTable
            rows={suggestions}
            rowKey={(s) => s.itemId}
            pageSize={12}
            emptyState={
              <EmptyState
                icon={<TrendingUp className="size-6" />}
                title="No suggestions"
                description="Consumption history will build forecasts over time."
              />
            }
            columns={[
              {
                key: "item",
                header: "Item",
                cell: (s) => (
                  <Link href="/inventory/items" className="text-sm font-medium hover:underline">
                    {db.items.find((i) => i.id === s.itemId)?.name ?? s.itemId}
                  </Link>
                ),
              },
              {
                key: "current",
                header: "Current",
                align: "right",
                cell: (s) => s.currentStock,
              },
              {
                key: "usage",
                header: "Avg daily use",
                align: "right",
                cell: (s) => s.avgDailyUsage.toFixed(2),
              },
              {
                key: "days",
                header: "Days left",
                align: "right",
                cell: (s) => (
                  <span
                    className={`tabular-nums ${
                      s.daysRemaining <= 3
                        ? "text-red-600"
                        : s.daysRemaining <= 7
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {s.daysRemaining}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (s) => {
                  const item = db.items.find((i) => i.id === s.itemId);
                  return (
                    <StockStatusBadge
                      status={
                        s.currentStock <= 0
                          ? "out"
                          : s.currentStock < (item?.minStock ?? 0)
                            ? "low"
                            : "healthy"
                      }
                    />
                  );
                },
              },
              {
                key: "suggest",
                header: "Suggest order",
                align: "right",
                cell: (s) => (
                  <span className="tabular-nums">
                    {s.suggestedQty}{" "}
                    {db.items.find((i) => i.id === s.itemId)?.purchaseUnit ?? ""}
                  </span>
                ),
              },
              {
                key: "cost",
                header: "Est. cost",
                align: "right",
                cell: (s) => {
                  const item = db.items.find((i) => i.id === s.itemId);
                  return (
                    <span className="tabular-nums">
                      {formatMoneyShort(s.suggestedQty * (item?.purchasePrice ?? 0))}
                    </span>
                  );
                },
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
