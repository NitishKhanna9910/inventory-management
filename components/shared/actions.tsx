"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { HelpCircle, Keyboard, Lightbulb, RotateCcw, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

/* ---------------- Global search command palette ---------------- */

export function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const { db } = useStore();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 1) return [];
    const out: { label: string; sub: string; href: string; group: string }[] = [];
    for (const i of db.items) {
      if (
        i.name.toLowerCase().includes(term) ||
        i.sku.toLowerCase().includes(term) ||
        i.barcode.includes(term)
      ) {
        out.push({ label: i.name, sub: `${i.sku} · ${i.barcode || "no barcode"}`, href: `/inventory/${i.id}`, group: "Items" });
      }
      if (out.length > 40) break;
    }
    for (const p of db.purchaseOrders) {
      if (p.poNumber.toLowerCase().includes(term)) {
        out.push({ label: p.poNumber, sub: db.suppliers.find((s) => s.id === p.supplierId)?.name ?? "", href: `/purchase-orders/${p.id}`, group: "Purchase Orders" });
      }
    }
    for (const s of db.suppliers) {
      if (s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)) {
        out.push({ label: s.name, sub: s.code, href: `/suppliers/${s.id}`, group: "Suppliers" });
      }
    }
    for (const r of db.recipes) {
      if (r.name.toLowerCase().includes(term)) {
        out.push({ label: r.name, sub: "Recipe", href: `/recipes/${r.id}`, group: "Recipes" });
      }
    }
    for (const m of db.menuItems) {
      if (m.name.toLowerCase().includes(term)) {
        out.push({ label: m.name, sub: `Menu · ${m.category}`, href: "/menu", group: "Menu" });
      }
    }
    return out.slice(0, 24);
  }, [q, db]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items, SKUs, POs, suppliers…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Global search"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          {q.trim() === "" ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Type to search across inventory, purchasing, suppliers and recipes.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No matches found.</p>
          ) : (
            results.map((r, idx) => (
              <button
                key={`${r.href}-${idx}`}
                onClick={() => go(r.href)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{r.sub}</span>
                </span>
                <span className="ml-3 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {r.group}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Help panel ---------------- */

const HELP_TOPICS: { title: string; body: string }[] = [
  {
    title: "How stock levels work",
    body: "Stock changes ONLY through explicit operations — purchase receipts, manual stock in/out, waste, transfers and finalized stock counts. Every change writes an entry in the stock movement ledger so the history is auditable.",
  },
  {
    title: "Low stock & reordering",
    body: "An item is Low Stock when quantity is at or below its minimum threshold, and Out of Stock at zero. The Forecasting page estimates average daily usage from the last 30 days of consumption movements and suggests reorder dates that account for supplier lead time.",
  },
  {
    title: "Purchase orders vs stock",
    body: "Creating or approving a purchase order does NOT increase stock. Stock increases only when you receive goods on the Receiving page. You can receive partially — remaining quantities stay open on the order.",
  },
  {
    title: "Unit conversions",
    body: "Items store stock in a base unit (e.g. bottles) but can be purchased in a different unit (e.g. carton of 24). The conversion factor converts purchase quantities into base units automatically on receipt.",
  },
  {
    title: "Waste & spoilage",
    body: "Recording waste reduces available stock and posts a Waste movement. You cannot record more waste than the available quantity at that outlet.",
  },
  {
    title: "Stock counts",
    body: "Create a count session, enter physically counted quantities, review variances, then finalize. Finalization posts adjustments for variances and locks the session permanently.",
  },
  {
    title: "Transfers",
    body: "Transfers never duplicate stock. Quantity is deducted from the source outlet at dispatch, and added to the destination outlet only when received. Damaged quantities are recorded at receipt.",
  },
  {
    title: "Recipe costing",
    body: "Food Cost % = (Ingredient Cost Per Serving ÷ Selling Price) × 100. Ingredient quantities entered in a recipe unit (e.g. grams) are converted to the stock base unit (e.g. kg) before costing.",
  },
];

export function HelpPanel() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label="Help">
        <HelpCircle />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>StockPilot help</DialogTitle>
            <DialogDescription>
              Quick explanations of inventory concepts and common workflows in this demo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {HELP_TOPICS.map((t) => (
              <div key={t.title} className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold">
                  <Lightbulb className="size-3.5 text-warning" /> {t.title}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
          <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <Keyboard className="mr-1 inline size-3.5" />
            Tip: press <kbd className="rounded border bg-muted px-1">Ctrl/⌘ + K</kbd> anywhere to open
            global search.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Demo scenarios ---------------- */

export function DemoScenarios() {
  const { update } = useStore();
  const router = useRouter();
  const { success, error } = useToast();
  const [open, setOpen] = React.useState(false);
  const [running, setRunning] = React.useState<string | null>(null);

  const runScenario = (kind: "reorder" | "waste") => {
    setRunning(kind);
    try {
      update((db) => {
        // Scenario 1: low stock → recommendation → PO → ordered → received
        if (kind === "reorder") {
          const item = db.items.find((i) => i.id === "itm_coffee_beans")!;
          const balIdx = db.balances.findIndex((b) => b.itemId === item.id && b.outletId === "out_cafe");
          const balances = [...db.balances];
          if (balIdx >= 0) balances[balIdx] = { ...balances[balIdx], qty: 4.2, updatedAt: new Date().toISOString() };

          const po = {
            id: `po_demo_${Date.now()}`,
            poNumber: `PO-${String(9000 + Math.floor(Math.random() * 900))}`,
            supplierId: item.preferredSupplierId,
            outletId: "out_cafe",
            orderDate: new Date().toISOString().slice(0, 10),
            expectedDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            lines: [{
              id: "ln_demo_1", itemId: item.id, qtyOrdered: 25, unitCost: 940,
              qtyReceived: 25, discountPct: 0, taxPct: 5, status: "received" as const,
            }],
            status: "received" as const,
            notes: "Demo scenario: coffee beans replenishment",
            createdBy: "Demo Scenario",
            statusHistory: [
              { at: new Date().toISOString(), status: "draft" as const, by: "Demo Scenario" },
              { at: new Date().toISOString(), status: "approved" as const, by: "Demo Scenario" },
              { at: new Date().toISOString(), status: "ordered" as const, by: "Demo Scenario" },
              { at: new Date().toISOString(), status: "received" as const, by: "Demo Scenario" },
            ],
            receiptIds: [`grn_demo_${Date.now()}`],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const receipt = {
            id: `grn_demo_${Date.now()}`,
            grnNumber: `GRN-${String(9000 + Math.floor(Math.random() * 900))}`,
            poId: po.id, supplierId: item.preferredSupplierId, outletId: "out_cafe",
            receivedAt: new Date().toISOString(), receivedBy: "Demo Scenario",
            lines: [{
              lineId: "ln_demo_1", itemId: item.id, orderedQty: 25, receivedQty: 25,
              damagedQty: 0, acceptedQty: 25, unitCost: 940, batchNo: "DEMO-B1",
              expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
            }],
            notes: "Demo scenario receipt", createdAt: new Date().toISOString(),
          };
          const avgCost = 940;
          const balIdx2 = balances.findIndex((b) => b.itemId === item.id && b.outletId === "out_cafe");
          if (balIdx2 >= 0) {
            balances[balIdx2] = {
              ...balances[balIdx2],
              qty: 29.2,
              avgCost,
              updatedAt: new Date().toISOString(),
            };
          }
          return {
            ...db, balances, purchaseOrders: [po, ...db.purchaseOrders], receipts: [receipt, ...db.receipts],
            movements: [{
              id: `mov_demo_${Date.now()}`, at: new Date().toISOString(), refNo: receipt.grnNumber,
              type: "purchase_receipt" as const, itemId: item.id, outletId: "out_cafe",
              qtyIn: 25, qtyOut: 0, unitCost: avgCost, balanceAfter: 29.2,
              performedBy: "Demo Scenario", notes: "Scenario: coffee beans replenished", relatedId: po.id,
            }, ...db.movements],
            notifications: [{
              id: `ntf_demo_${Date.now()}`, kind: "low_stock" as const,
              title: "Scenario complete: coffee restocked",
              body: "PO created, approved, ordered and received. Stock now 29.2 kg at Downtown Cafe.",
              link: "/inventory/itm_coffee_beans", at: new Date().toISOString(), read: false,
            }, ...db.notifications],
          };
        }
        // Scenario 2: waste recording
        const item = db.items.find((i) => i.id === "itm_egg")!;
        const balIdx = db.balances.findIndex((b) => b.itemId === item.id && b.outletId === "out_cafe");
        const balances = [...db.balances];
        const current = balances[balIdx]?.qty ?? 0;
        if (balIdx >= 0) balances[balIdx] = { ...balances[balIdx], qty: Math.max(0, current - 12), updatedAt: new Date().toISOString() };
        const unitCost = balances[balIdx]?.avgCost || 7;
        const rec = {
          id: `wst_demo_${Date.now()}`, itemId: item.id, outletId: "out_cafe", qty: 12,
          unitCost, cost: Math.round(12 * unitCost * 100) / 100, reason: "Expired" as const,
          at: new Date().toISOString(), notes: "Demo scenario: expired eggs disposed", recordedBy: "Demo Scenario",
        };
        return {
          ...db, balances, waste: [rec, ...db.waste],
          movements: [{
            id: `mov_demo_w_${Date.now()}`, at: new Date().toISOString(), refNo: "WST-DEMO",
            type: "waste" as const, itemId: item.id, outletId: "out_cafe",
            qtyIn: 0, qtyOut: 12, unitCost, balanceAfter: Math.max(0, current - 12),
            performedBy: "Demo Scenario", notes: "Expired — demo scenario", relatedId: rec.id,
          }, ...db.movements],
        };
      });
      success(
        kind === "reorder" ? "Reorder scenario complete" : "Waste scenario complete",
        kind === "reorder"
          ? "Coffee beans restocked via a full PO → receipt workflow."
          : "12 eggs marked expired at Downtown Cafe; stock & analytics updated."
      );
      setOpen(false);
      router.push(kind === "reorder" ? "/dashboard" : "/waste");
    } catch (e) {
      error("Scenario failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(null);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="text-warning" /> Load Sample Scenario
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Load sample scenario</DialogTitle>
            <DialogDescription>
              Run a scripted workflow that touches multiple modules so you can see the end-to-end flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">1. Low stock → reorder → receipt</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coffee beans drop below minimum at Downtown Cafe → a PO is created, approved, ordered and
                fully received. Watch the dashboard, inventory and movement ledger update.
              </p>
              <Button size="sm" className="mt-3" onClick={() => runScenario("reorder")} disabled={!!running}>
                {running === "reorder" ? "Running…" : "Run scenario 1"}
              </Button>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold">2. Record waste & review impact</p>
              <p className="mt-1 text-xs text-muted-foreground">
                12 eggs at Downtown Cafe are marked expired. Stock drops, a waste movement is posted and
                waste analytics update.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => runScenario("waste")} disabled={!!running}>
                {running === "waste" ? "Running…" : "Run scenario 2"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ResetDemoButton() {
  const { reset } = useStore();
  const router = useRouter();
  const { success } = useToast();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw /> Reset Demo Data
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset all demo data?</DialogTitle>
            <DialogDescription>
              This clears everything you changed in this browser and restores the original seeded demo
              dataset for “The Urban Table”. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                reset();
                setOpen(false);
                success("Demo data reset", "Original seeded data has been restored.");
                router.push("/dashboard");
              }}
            >
              Yes, reset everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- misc helpers ---------------- */

export function OutletFilter({
  value,
  onChange,
  includeAll = true,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  includeAll?: boolean;
  className?: string;
}) {
  const { db } = useStore();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[190px]"}>
        <SelectValue placeholder="Outlet" />
      </SelectTrigger>
      <SelectContent>
        {includeAll ? <SelectItem value="all">All outlets</SelectItem> : null}
        {db.outlets.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
      <Sparkles className="size-3" /> Demo Mode
    </span>
  );
}

export function QuickLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Button key={l.href} asChild variant="outline" size="sm">
          <Link href={l.href}>{l.label}</Link>
        </Button>
      ))}
    </div>
  );
}

export function SettingsLabel({ children }: { children: React.ReactNode }) {
  return <Label className="mb-1 block">{children}</Label>;
}
