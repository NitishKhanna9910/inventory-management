import type {
  Category,
  InventoryBalance,
  InventoryItem,
  Recipe,
  StockBatch,
  StockMovement,
  Supplier,
  Unit,
} from "./types";
import { round3, round2 } from "./utils";
import { convertQty } from "./types";

/* ---------- Currency & money ---------- */

export function computeLineTotals(line: {
  qty: number;
  unitCost: number;
  discountPct?: number;
  taxPct?: number;
}) {
  const subtotal = line.qty * line.unitCost;
  const discount = subtotal * ((line.discountPct ?? 0) / 100);
  const taxable = subtotal - discount;
  const tax = taxable * ((line.taxPct ?? 0) / 100);
  return { subtotal, discount, tax, total: taxable + tax };
}

export function computePOGrandTotals(
  lines: { qty: number; unitCost: number; discountPct?: number; taxPct?: number; status?: string }[]
) {
  const usable = lines.filter((l) => l.status !== "cancelled");
  const subtotal = usable.reduce((a, l) => a + l.qty * l.unitCost, 0);
  const discount = usable.reduce(
    (a, l) => a + l.qty * l.unitCost * ((l.discountPct ?? 0) / 100),
    0
  );
  const tax = usable.reduce((a, l) => {
    const sub = l.qty * l.unitCost;
    const disc = sub * ((l.discountPct ?? 0) / 100);
    return a + (sub - disc) * ((l.taxPct ?? 0) / 100);
  }, 0);
  return { subtotal: round2(subtotal), discount: round2(discount), tax: round2(tax), total: round2(subtotal - discount + tax) };
}

/* ---------- Stock status & valuation ---------- */

export function getStockStatus(
  qty: number,
  minStock: number
): "healthy" | "low" | "out" {
  if (qty <= 0.0001) return "out";
  if (qty <= minStock) return "low";
  return "healthy";
}

export function itemStock(
  balances: InventoryBalance[],
  itemId: string,
  outletId?: string
): number {
  return balances
    .filter((b) => b.itemId === itemId && (!outletId || b.outletId === outletId))
    .reduce((a, b) => a + b.qty, 0);
}

export function calculateInventoryValuation(
  items: InventoryItem[],
  balances: InventoryBalance[]
): {
  totalValue: number;
  perItem: { itemId: string; qty: number; value: number }[];
  perOutlet: { outletId: string; value: number }[];
  perCategory: { categoryId: string; value: number }[];
} {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const perItem = balances.map((b) => {
    const item = itemMap.get(b.itemId);
    const cost = item ? (b.avgCost || item.avgCost) : 0;
    return { itemId: b.itemId, outletId: b.outletId, qty: b.qty, value: b.qty * cost };
  });
  const totalValue = perItem.reduce((a, p) => a + p.value, 0);

  const perOutletMap = new Map<string, number>();
  const perCategoryMap = new Map<string, number>();
  for (const p of perItem) {
    perOutletMap.set(p.outletId, (perOutletMap.get(p.outletId) ?? 0) + p.value);
    const item = itemMap.get(p.itemId);
    const cat = item?.categoryId ?? "unknown";
    perCategoryMap.set(cat, (perCategoryMap.get(cat) ?? 0) + p.value);
  }
  return {
    totalValue,
    perItem: perItem.map(({ itemId, qty, value }) => ({ itemId, qty, value })),
    perOutlet: [...perOutletMap.entries()].map(([outletId, value]) => ({ outletId, value })),
    perCategory: [...perCategoryMap.entries()].map(([categoryId, value]) => ({ categoryId, value })),
  };
}

/* ---------- Weighted average cost ---------- */

export function applyWeightedAverage(
  currentQty: number,
  currentCost: number,
  addedQty: number,
  addedCost: number
): number {
  if (addedQty <= 0) return currentCost;
  if (currentQty <= 0) return addedCost;
  return (currentQty * currentCost + addedQty * addedCost) / (currentQty + addedQty);
}

/* ---------- Recipe costing ---------- */

export interface RecipeCostBreakdown {
  ingredientCost: number;
  costPerServing: number;
  sellingPrice: number;
  foodCostPct: number;
  grossContribution: number;
  servingsFromStock: number;
  missingIngredients: string[];
  lines: {
    itemId: string;
    name: string;
    qtyBase: number;
    baseUnit: Unit;
    unitCost: number;
    cost: number;
    availableQty: number;
    hasStock: boolean;
  }[];
}

/**
 * Recipe ingredient qty is entered in the ingredient item's recipeUnit.
 * Stock is held in baseUnit. Conversion is applied so e.g. 200 g recipe usage
 * consumes 0.2 kg of stock.
 */
export function calculateRecipeCost(
  recipe: Recipe,
  items: InventoryItem[],
  balances: InventoryBalance[],
  outlets?: string[]
): RecipeCostBreakdown {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const lines: RecipeCostBreakdown["lines"] = [];
  let ingredientCost = 0;
  const missing: string[] = [];
  let servingsFromStock = Infinity;

  for (const ing of recipe.ingredients) {
    const item = itemMap.get(ing.itemId);
    if (!item) {
      missing.push(ing.itemId);
      continue;
    }
    const recipeUnit = item.conversion?.recipeUnit ?? item.recipeUnit ?? item.baseUnit;
    const recipeQtyPerBase = item.conversion?.recipeQtyPerBase || 1;
    const qtyBase = convertQty(ing.qty, recipeUnit, item.baseUnit, item.conversion?.purchaseQty) / recipeQtyPerBase;
    const available = itemStock(balances, ing.itemId);
    const unitCost = item.avgCost;
    const cost = qtyBase * unitCost;
    ingredientCost += cost;
    const hasStock = available >= qtyBase;
    if (!hasStock) missing.push(item.name);
    if (qtyBase > 0) servingsFromStock = Math.min(servingsFromStock, Math.floor(available / qtyBase));
    lines.push({
      itemId: item.id,
      name: item.name,
      qtyBase,
      baseUnit: item.baseUnit,
      unitCost,
      cost,
      availableQty: available,
      hasStock,
    });
  }

  const yieldQty = recipe.yieldQty > 0 ? recipe.yieldQty : 1;
  const costPerServing = ingredientCost / yieldQty;
  const sellingPrice = recipe.sellingPrice;
  const foodCostPct = sellingPrice > 0 ? (costPerServing / sellingPrice) * 100 : 0;

  void outlets;
  return {
    ingredientCost: round2(ingredientCost),
    costPerServing: round2(costPerServing),
    sellingPrice,
    foodCostPct: round2(foodCostPct),
    grossContribution: round2(sellingPrice - costPerServing),
    servingsFromStock: Number.isFinite(servingsFromStock) ? servingsFromStock : 0,
    missingIngredients: missing,
    lines,
  };
}

export function calculateFoodCostPercentage(costPerServing: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return round2((costPerServing / sellingPrice) * 100);
}

/* ---------- Consumption / forecast ---------- */

export function averageDailyConsumption(
  movements: StockMovement[],
  itemId: string,
  outletId: string | undefined,
  lookbackDays = 30
): number {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const relevant = movements.filter(
    (m) =>
      m.itemId === itemId &&
      (!outletId || m.outletId === outletId) &&
      m.qtyOut > 0 &&
      ["recipe_consumption", "stock_out", "waste"].includes(m.type) &&
      new Date(m.at).getTime() >= cutoff
  );
  const totalOut = relevant.reduce((a, m) => a + m.qtyOut, 0);
  return round3(totalOut / lookbackDays);
}

export interface ReorderSuggestion {
  itemId: string;
  currentStock: number;
  avgDailyUsage: number;
  daysRemaining: number;
  leadTimeDays: number;
  reorderByDate: string;
  suggestedQty: number;
  urgency: "critical" | "high" | "medium" | "low";
  confidence: "Low" | "Medium" | "High";
  observations: number;
}

export function generateReorderSuggestions(
  items: InventoryItem[],
  balances: InventoryBalance[],
  movements: StockMovement[],
  suppliers: Supplier[]
): ReorderSuggestion[] {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
  const cutoff30 = Date.now() - 30 * 86_400_000;
  const out: ReorderSuggestion[] = [];

  for (const item of items) {
    if (item.status !== "active") continue;
    const stock = itemStock(balances, item.id);
    const usage = averageDailyConsumption(movements, item.id, undefined, 30);
    const observations = movements.filter(
      (m) => m.itemId === item.id && m.qtyOut > 0 && new Date(m.at).getTime() >= cutoff30
    ).length;

    const supplier = supplierMap.get(item.preferredSupplierId);
    const lead = supplier?.leadTimeDays ?? 3;
    if (usage <= 0 && stock > item.minStock) continue;

    const daysRemaining = usage > 0 ? Math.floor(stock / usage) : 999;
    const daysToReorder = daysRemaining - lead;
    const reorderBy = new Date();
    reorderBy.setDate(reorderBy.getDate() + Math.max(0, daysToReorder));

    const target = Math.max(item.minStock * 1.5, usage * (lead + 14), item.reorderQty);
    const suggestedQty = Math.max(item.reorderQty, round2(target - stock));

    let urgency: ReorderSuggestion["urgency"] = "low";
    if (stock <= 0) urgency = "critical";
    else if (stock <= item.minStock) urgency = daysToReorder <= 0 ? "critical" : "high";
    else if (daysToReorder <= 2) urgency = "high";
    else if (daysToReorder <= 5) urgency = "medium";

    if (urgency === "low" && daysRemaining > 30) continue;

    const confidence: ReorderSuggestion["confidence"] =
      observations >= 15 ? "High" : observations >= 6 ? "Medium" : "Low";

    out.push({
      itemId: item.id,
      currentStock: round2(stock),
      avgDailyUsage: usage,
      daysRemaining,
      leadTimeDays: lead,
      reorderByDate: reorderBy.toISOString().slice(0, 10),
      suggestedQty,
      urgency,
      confidence,
      observations,
    });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  return out.sort((a, b) => order[a.urgency] - order[b.urgency]);
}

/* ---------- Expiry helpers ---------- */

export function batchesExpiringSoon(
  batches: StockBatch[],
  days: number
): StockBatch[] {
  const limit = Date.now() + days * 86_400_000;
  return batches.filter((b) => {
    if (b.qty <= 0) return false;
    const t = new Date(b.expiryDate).getTime();
    return t <= limit;
  });
}

export function categoriesWithCounts(
  categories: Category[],
  items: InventoryItem[],
  balances: InventoryBalance[]
) {
  return categories.map((c) => {
    const catItems = items.filter((i) => i.categoryId === c.id);
    const ids = new Set(catItems.map((i) => i.id));
    const value = balances
      .filter((b) => ids.has(b.itemId))
      .reduce((a, b) => {
        const item = items.find((i) => i.id === b.itemId);
        return a + b.qty * (b.avgCost || item?.avgCost || 0);
      }, 0);
    return { category: c, itemCount: catItems.length, value: round2(value) };
  });
}
