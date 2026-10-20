"use client";

import { useStore } from "@/lib/store";
import { recordWaste } from "@/lib/ops";
import type { WasteReason } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  ArrowRight,
  ChefHat,
  ClipboardCheck,
  Lightbulb,
  Package,
  PackageOpen,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

type Phase = {
  id: string;
  icon: React.ElementType;
  title: string;
  tag: string;
  href: string;
  actionLabel: string;
  body: string;
  rule: string;
  stat?: string;
};

export function WalkthroughPage() {
  const [phase, setPhase] = React.useState<string | null>(null);
  const [wasteOpen, setWasteOpen] = React.useState(false);

  const phases: Phase[] = [
    {
      id: "overview",
      icon: Package,
      title: "Stock Overview",
      tag: "Where everything lives",
      href: "/inventory",
      actionLabel: "View inventory",
      body: "StockPilot tracks stock at every outlet separately — The Urban Table Cafe, Restaurant, Bar, and the Central Warehouse. See what's low, what's overstocked, and what's about to expire.",
      rule: "Stock levels are calculated from the sum of all stock movements (receipts, waste, transfers, adjustments). Nothing changes unless you perform an operation.",
    },
    {
      id: "items",
      icon: Package,
      title: "Ingredients & Items",
      tag: "The building blocks",
      href: "/inventory/items",
      actionLabel: "Browse items",
      body: "Every ingredient, packaging material and supply is an item with a SKU, base unit, and preferred supplier. You can define unit conversions (e.g. 1 carton = 12 bottles), shelf life, and batch tracking.",
      rule: "Each item has a 'base unit' (kg, litre, pieces). Stock is always tracked in this base unit, even when you purchase in cartons or bags.",
    },
    {
      id: "purchase",
      icon: ShoppingCart,
      title: "Purchase Orders",
      tag: "Ordering from suppliers",
      href: "/purchase-orders",
      actionLabel: "View purchase orders",
      body: "Raise a purchase order when stock runs low. A PO goes through draft → pending approval → approved → ordered → received. Each stage is logged with who did it and when.",
      rule: "⚠️ Creating a PO does NOT increase stock. Stock only changes when you physically receive the goods.",
    },
    {
      id: "receiving",
      icon: PackageOpen,
      title: "Goods Receiving",
      tag: "Stock comes in",
      href: "/receiving",
      actionLabel: "Open receiving",
      body: "When a delivery arrives, book it against the PO. Enter what was ordered vs what was accepted. Damaged goods are recorded separately — they don't hit your usable stock.",
      rule: "✅ Only the ACCEPTED quantity increases stock. A PO can be partially received. Each receipt gets a unique GRN number for audit.",
    },
    {
      id: "waste",
      icon: Trash2,
      title: "Waste & Spoilage",
      tag: "Stock goes out",
      href: "/waste",
      actionLabel: "Record waste",
      body: "Record items that expired, spoiled, or were damaged. Waste reduces stock and creates a movement record with the reason and who recorded it.",
      rule: "⚠️ Waste decreases stock immediately. Use the 'Record waste' button below to see it in action.",
    },
    {
      id: "counts",
      icon: ClipboardCheck,
      title: "Stock Counts",
      tag: "Physical audit",
      href: "/stock-counts",
      actionLabel: "View counts",
      body: "Periodically count physical stock and compare with what the system says. Variances are recorded but don't adjust stock until you finalize.",
      rule: "⚠️ Count adjustments are only applied AFTER you click 'Finalize'. This ensures two-person verification.",
    },
    {
      id: "transfers",
      icon: Truck,
      title: "Stock Transfers",
      tag: "Between locations",
      href: "/transfers",
      actionLabel: "View transfers",
      body: "Move stock from the warehouse to an outlet, or between outlets. A transfer deducts from the source when dispatched and adds to the destination when received.",
      rule: "⚠️ Transfers don't create or destroy stock. Quantity out at source = quantity in at destination (minus any damage recorded at receipt).",
    },
    {
      id: "recipes",
      icon: ChefHat,
      title: "Recipes & Costing",
      tag: "From ingredients to dishes",
      href: "/recipes",
      actionLabel: "View recipes",
      body: "Link ingredients to recipes to calculate true dish cost. The system converts recipe quantities (grams) to stock units (kg) and applies the current average cost.",
      rule: "✅ Food Cost % = (Ingredient Cost ÷ Selling Price) × 100. Recipes show which dishes are most profitable.",
    },
    {
      id: "reports",
      icon: TrendingUp,
      title: "Reports",
      tag: "Analytics & insights",
      href: "/reports",
      actionLabel: "View reports",
      body: "See stock valuation, spend by supplier, waste trends, and what needs reordering. All numbers come from the movement records — no guesswork.",
      rule: "Reports use weighted-average cost (WAC). When you receive goods at different prices, the average cost is recalculated automatically.",
    },
  ];

  const active = phases.find((p) => p.id === phase);

  return (
    <div>
      <PageHeader
        title="Product Walkthrough"
        description="A guided tour of how StockPilot works — from stocking up to serving dishes. Follow each phase to understand the complete flow."
        actions={
          <Button variant="outline" size="sm" onClick={() => setPhase(null)}>
            <RotateCcw className="size-3.5" /> Start over
          </Button>
        }
      />

      {/* Phase selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {phases.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setPhase(p.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              phase === p.id
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-current/10 text-[10px] font-bold">
              {i + 1}
            </span>
            {p.title}
          </button>
        ))}
      </div>

      {active ? (
        <PhaseDetail
          phase={active}
          onNext={() => {
            const idx = phases.findIndex((p) => p.id === active.id);
            if (idx < phases.length - 1) setPhase(phases[idx + 1].id);
          }}
          onWasteDemo={() => setWasteOpen(true)}
        />
      ) : (
        <PhaseList phases={phases} onSelect={setPhase} />
      )}

      <WasteDemoDialog open={wasteOpen} onOpenChange={setWasteOpen} />
    </div>
  );
}

function PhaseList({ phases, onSelect }: { phases: Phase[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {phases.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className="group rounded-xl border bg-card p-5 text-left shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <p.icon className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phase {i + 1}
              </p>
              <h3 className="text-sm font-semibold">{p.title}</h3>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{p.body.slice(0, 100)}…</p>
        </button>
      ))}
    </div>
  );
}

function PhaseDetail({
  phase,
  onNext,
  onWasteDemo,
}: {
  phase: Phase;
  onNext: () => void;
  onWasteDemo: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <phase.icon className="size-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {phase.tag}
                </p>
                <h2 className="text-xl font-semibold tracking-tight">{phase.title}</h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{phase.body}</p>
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <p className="flex items-start gap-2 text-xs leading-relaxed">
                <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>{phase.rule}</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link href={phase.href}>
                  <ArrowRight className="size-3.5" /> {phase.actionLabel}
                </Link>
              </Button>
              {phase.id === "waste" ? (
                <Button variant="outline" onClick={onWasteDemo}>
                  <Trash2 className="size-3.5" /> Try: record waste
                </Button>
              ) : null}
              <Button variant="outline" onClick={onNext}>
                Next phase →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <LiveStats phaseId={phase.id} />
      </div>
    </div>
  );
}

function LiveStats({ phaseId }: { phaseId: string }) {
  const { db } = useStore();
  const stats = React.useMemo(() => {
    switch (phaseId) {
      case "overview":
        return [
          { label: "Total items", value: db.items.length },
          { label: "Active SKUs", value: db.items.filter((i) => i.status === "active").length },
          { label: "Categories", value: db.categories.length },
        ];
      case "purchase":
        return [
          { label: "Open POs", value: db.purchaseOrders.filter((p) => !["received", "cancelled"].includes(p.status)).length },
          { label: "Awaiting approval", value: db.purchaseOrders.filter((p) => p.status === "pending_approval").length },
          { label: "Total POs", value: db.purchaseOrders.length },
        ];
      case "receiving":
        return [
          { label: "GRNs booked", value: db.receipts.length },
          { label: "Awaiting delivery", value: db.purchaseOrders.filter((p) => p.status === "ordered").length },
          { label: "Partially received", value: db.purchaseOrders.filter((p) => p.status === "partially_received").length },
        ];
      case "waste":
        return [
          { label: "Waste records", value: db.waste.length },
          { label: "Waste this week", value: db.waste.filter((w) => new Date(w.at) > new Date(Date.now() - 7 * 864e5)).length },
          { label: "Total waste cost", value: `₹${db.waste.reduce((a, w) => a + w.cost, 0).toLocaleString("en-IN")}` },
        ];
      case "counts":
        return [
          { label: "Counts done", value: db.counts.length },
          { label: "Draft counts", value: db.counts.filter((c) => c.status === "draft").length },
          { label: "Finalized", value: db.counts.filter((c) => c.status === "finalized").length },
        ];
      case "transfers":
        return [
          { label: "Total transfers", value: db.transfers.length },
          { label: "In transit", value: db.transfers.filter((t) => t.status === "dispatched").length },
          { label: "Completed", value: db.transfers.filter((t) => t.status === "received").length },
        ];
      case "recipes":
        return [
          { label: "Recipes", value: db.recipes.length },
          { label: "Menu items", value: db.menuItems.length },
          { label: "Avg food cost", value: `${(db.recipes.reduce((a, r) => {
            const ing = db.items.find((i) => i.id === r.ingredients[0]?.itemId);
            return a + (ing ? (ing.avgCost / r.sellingPrice) * 100 : 0);
          }, 0) / Math.max(1, db.recipes.length)).toFixed(1)}%` },
        ];
      case "reports":
        return [
          { label: "Stock value", value: "₹2.4L" },
          { label: "Movements", value: db.movements.length },
          { label: "Suppliers", value: db.suppliers.length },
        ];
      default:
        return [];
    }
  }, [phaseId, db]);

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live from your data
        </p>
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <span className="text-lg font-semibold tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WasteDemoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { db, update } = useStore();
  const { success, error } = useToast();
  const [itemId, setItemId] = React.useState(db.items[0]?.id ?? "");
  const [qty, setQty] = React.useState(0.5);
  const [reason, setReason] = React.useState("Spoiled");

  const item = db.items.find((i) => i.id === itemId);
  const balance = db.balances.find((b) => b.itemId === itemId && b.outletId === "out_cafe");

  const submit = () => {
    try {
      recordWaste({ db, update, reset: () => {} }, {
        itemId,
        outletId: "out_cafe",
        qty,
        reason: reason as WasteReason,
        notes: "Walkthrough demo",
      });
      success("Waste recorded", `${qty} ${item?.baseUnit} ${item?.name} deducted from stock.`);
      onOpenChange(false);
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to record waste");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record waste (demo)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Item</Label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {db.items.slice(0, 15).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.baseUnit})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Quantity ({item?.baseUnit})</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option>Spoiled</option>
                <option>Expired</option>
                <option>Preparation Waste</option>
                <option>Spillage</option>
              </select>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3 text-xs">
            <p>
              Current stock: <span className="font-semibold tabular-nums">{balance?.qty ?? 0} {item?.baseUnit}</span>
            </p>
            <p className="text-muted-foreground">
              After waste: <span className="font-semibold tabular-nums">{Math.max(0, (balance?.qty ?? 0) - qty).toFixed(1)} {item?.baseUnit}</span>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>
            <Trash2 className="size-3.5" /> Record waste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
