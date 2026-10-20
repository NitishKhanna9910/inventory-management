"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useStore } from "@/lib/store";
import { calculateRecipeCost } from "@/lib/calculations";
import { formatMoneyShort } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import * as React from "react";

export function MenuPage() {
  const { db } = useStore();
  const [cat, setCat] = React.useState("all");

  const categories = Array.from(new Set(db.menuItems.map((m) => m.category)));

  const rows = db.menuItems
    .filter((m) => cat === "all" || m.category === cat)
    .map((m) => {
      const recipe = db.recipes.find((r) => r.id === m.recipeId);
      const cost = recipe ? calculateRecipeCost(recipe, db.items, db.balances) : null;
      return { item: m, recipe, cost };
    });

  const totalValue = rows.reduce((a, r) => a + r.item.sellingPrice, 0);
  const avgFc =
    rows.filter((r) => r.cost).reduce((a, r) => a + (r.cost?.foodCostPct ?? 0), 0) /
    Math.max(1, rows.filter((r) => r.cost).length);

  return (
    <div>
      <PageHeader
        title="Menu Items"
        description="Your sellable dishes and drinks, linked to recipes and live costing."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Menu items"
          value={db.menuItems.length}
          hint={`${db.menuItems.filter((m) => m.available).length} available`}
          icon={<ClipboardList className="size-4" />}
        />
        <MetricCard label="Avg food cost" value={`${avgFc.toFixed(1)}%`} />
        <MetricCard
          label="Sum of menu prices"
          value={formatMoneyShort(totalValue)}
          hint="Not revenue — a quick reference"
        />
      </div>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-1.5">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  cat === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(r) => r.item.id}
            pageSize={12}
            emptyState={
              <EmptyState
                icon={<ClipboardList className="size-6" />}
                title="No menu items"
                description="Menu items will appear here once seeded."
              />
            }
            columns={[
              {
                key: "name",
                header: "Item",
                sortValue: (r) => r.item.name,
                cell: (r) => (
                  <div>
                    <p className="text-sm font-medium">{r.item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.item.sku}</p>
                  </div>
                ),
              },
              { key: "cat", header: "Category", cell: (r) => r.item.category },
              {
                key: "price",
                header: "Selling",
                align: "right",
                cell: (r) => formatMoneyShort(r.item.sellingPrice),
              },
              {
                key: "recipe",
                header: "Recipe",
                cell: (r) =>
                  r.recipe ? (
                    <span className="text-xs">{r.recipe.name}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No recipe</span>
                  ),
              },
              {
                key: "fc",
                header: "Food cost %",
                align: "right",
                cell: (r) =>
                  r.cost ? (
                    <span
                      className={`tabular-nums ${
                        r.cost.foodCostPct > (r.recipe?.targetFoodCostPct ?? 30)
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {r.cost.foodCostPct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  ),
              },
              {
                key: "available",
                header: "Available",
                cell: (r) =>
                  r.item.available ? (
                    <span className="text-xs text-emerald-600">● Yes</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">● No</span>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
