"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useStore } from "@/lib/store";
import {
  calculateFoodCostPercentage,
  calculateRecipeCost,
} from "@/lib/calculations";
import { formatMoneyShort } from "@/lib/utils";
import { ChefHat } from "lucide-react";
import Link from "next/link";

export function RecipesPage() {
  const { db } = useStore();

  const rows = db.recipes.map((r) => {
    const cost = calculateRecipeCost(r, db.items, db.balances);
    return { recipe: r, cost };
  });

  const avgFc =
    rows.reduce((a, r) => a + r.cost.foodCostPct, 0) / Math.max(1, rows.length);

  return (
    <div>
      <PageHeader
        title="Recipes & Costing"
        description="Link ingredients to dishes and watch food-cost percentage in real time."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Recipes"
          value={db.recipes.length}
          icon={<ChefHat className="size-4" />}
        />
        <MetricCard
          label="Avg food cost"
          value={`${avgFc.toFixed(1)}%`}
          hint="Across all recipes"
        />
        <MetricCard
          label="Missing ingredients"
          value={rows.filter((r) => r.cost.missingIngredients.length > 0).length}
          hint="Recipes with stock gaps"
        />
      </div>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(r) => r.recipe.id}
            pageSize={12}
            emptyState={
              <EmptyState
                icon={<ChefHat className="size-6" />}
                title="No recipes"
                description="Recipes will appear here once seeded."
              />
            }
            columns={[
              {
                key: "name",
                header: "Recipe",
                sortValue: (r) => r.recipe.name,
                cell: (r) => (
                  <Link
                    href={`/recipes/${r.recipe.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {r.recipe.name}
                  </Link>
                ),
              },
              {
                key: "yield",
                header: "Yield",
                cell: (r) => `${r.recipe.yieldQty} ${r.recipe.yieldUnit}`,
              },
              {
                key: "ingredients",
                header: "Ingredients",
                align: "right",
                cell: (r) => r.recipe.ingredients.length,
              },
              {
                key: "cost",
                header: "Cost / serving",
                align: "right",
                sortValue: (r) => r.cost.costPerServing,
                cell: (r) => (
                  <span className="tabular-nums">
                    {formatMoneyShort(r.cost.costPerServing)}
                  </span>
                ),
              },
              {
                key: "price",
                header: "Selling",
                align: "right",
                cell: (r) => formatMoneyShort(r.recipe.sellingPrice),
              },
              {
                key: "fc",
                header: "Food cost %",
                align: "right",
                sortValue: (r) => r.cost.foodCostPct,
                cell: (r) => (
                  <span
                    className={`tabular-nums ${
                      r.cost.foodCostPct > r.recipe.targetFoodCostPct
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {r.cost.foodCostPct.toFixed(1)}%
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function RecipeDetailPage({ id }: { id: string }) {
  const { db } = useStore();
  const r = db.recipes.find((x) => x.id === id);

  if (!r) {
    return (
      <div>
        <PageHeader title="Recipe not found" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Link href="/recipes" className="text-primary hover:underline">
              Back to recipes
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cost = calculateRecipeCost(r, db.items, db.balances);
  const fc = calculateFoodCostPercentage(cost.costPerServing, r.sellingPrice);

  return (
    <div>
      <PageHeader
        title={r.name}
        description={`${r.portionSize} | yields ${r.yieldQty} ${r.yieldUnit}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/recipes">All recipes</Link>
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <MetricCard label="Total cost" value={formatMoneyShort(cost.ingredientCost)} />
        <MetricCard label="Cost / serving" value={formatMoneyShort(cost.costPerServing)} />
        <MetricCard label="Selling price" value={formatMoneyShort(r.sellingPrice)} />
        <MetricCard
          label="Food cost %"
          value={`${fc.toFixed(1)}%`}
          hint={`Target ${r.targetFoodCostPct}%`}
        />
      </div>

      {cost.missingIngredients.length > 0 ? (
        <Card className="mb-5 border-amber-200 bg-amber-50 dark:bg-amber-500/10">
          <CardContent className="pt-5 text-sm text-amber-700 dark:text-amber-300">
            Low or missing stock: {cost.missingIngredients.join(", ")}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={cost.lines}
            rowKey={(i) => i.itemId}
            columns={[
              {
                key: "item",
                header: "Ingredient",
                cell: (i) => i.name,
              },
              { key: "qty", header: "Qty", align: "right", cell: (i) => i.qtyBase },
              {
                key: "unit",
                header: "Unit",
                cell: (i) => i.baseUnit,
              },
              {
                key: "unitcost",
                header: "Unit cost",
                align: "right",
                cell: (i) => formatMoneyShort(i.unitCost),
              },
              {
                key: "cost",
                header: "Cost",
                align: "right",
                cell: (i) => (
                  <span className={`tabular-nums ${i.hasStock ? "" : "text-red-600"}`}>
                    {formatMoneyShort(i.cost)}
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
