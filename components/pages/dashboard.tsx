"use client";

import { DemoScenarios, QuickLinks } from "@/components/shared/actions";
import { QuickStockDialog } from "@/components/shared/quick-actions";
import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangeInput } from "@/components/ui/date-range";
import { PoStatusBadge, StockStatusBadge, TransferStatusBadge } from "@/components/ui/status-badge";
import {
  calculateInventoryValuation,
  batchesExpiringSoon,
  calculateRecipeCost,
  generateReorderSuggestions,
  getStockStatus,
} from "@/lib/calculations";
import { sel, useStore } from "@/lib/store";
import { MOVEMENT_TYPE_LABELS } from "@/lib/types";
import { cn, daysUntil, formatDate, formatDateTime, formatMoneyShort, inDateRange, sumBy } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  ChefHat,
  ClipboardCheck,
  Package,
  PackageOpen,
  Plus,
  Receipt,
  ScrollText,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

const QUICK_ACTION_LINKS = [
  { label: "New purchase order", href: "/purchase-orders/new" },
  { label: "Receive goods", href: "/receiving" },
  { label: "Start stock count", href: "/stock-counts" },
  { label: "Record waste", href: "/waste" },
];

function useOutletEvent() {
  const [outlet, setOutlet] = React.useState("all");
  React.useEffect(() => {
    const fn = (e: Event) => setOutlet((e as CustomEvent<string>).detail);
    window.addEventListener("stockpilot:outlet", fn);
    return () => window.removeEventListener("stockpilot:outlet", fn);
  }, []);
  return outlet;
}

const PIE_COLORS = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#0891b2", "#65a30d", "#db2777"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function chartTooltip(currency = false) {
  return function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
        <p className="mb-1 font-medium">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.name}: {currency ? formatMoneyShort(p.value ?? 0) : (p.value ?? 0).toLocaleString("en-IN")}
          </p>
        ))}
      </div>
    );
  };
}

export function DashboardHome() {
  const { db } = useStore();
  const outlet = useOutletEvent();
  const [range, setRange] = React.useState<{ from: string; to: string }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  });
  const [quick, setQuick] = React.useState<null | "stock-in" | "stock-out" | "waste">(null);

  const currency = db.settings.profile.currency;

  const outletId = outlet === "all" ? undefined : outlet;
  const inScope = (o: string) => !outletId || o === outletId;

  const scopedItems = db.items.filter((i) => i.status === "active" && (!outletId || i.outletIds.includes(outletId)));
  const scopedBalances = db.balances.filter((b) => inScope(b.outletId));
  const scopedMovements = db.movements.filter((m) => inScope(m.outletId));

  const valuation = calculateInventoryValuation(scopedItems, scopedBalances);
  const itemMap = new Map(db.items.map((i) => [i.id, i]));

  const lowStock = scopedItems.filter((i) => {
    const qty = scopedBalances.filter((b) => b.itemId === i.id).reduce((a, b) => a + b.qty, 0);
    return getStockStatus(qty, i.minStock) !== "healthy";
  });

  const expiringBatches = batchesExpiringSoon(db.batches.filter((b) => inScope(b.outletId)), db.settings.inventory.expiryAlertDays);
  const wasteInRange = db.waste.filter((w) => inScope(w.outletId) && inDateRange(w.at, range.from, range.to));
  const wasteCost = sumBy(wasteInRange, (w) => w.cost);

  const pendingApprovals = db.purchaseOrders.filter((p) => p.status === "pending_approval").length;
  const openPOs = db.purchaseOrders.filter((p) => ["ordered", "partially_received"].includes(p.status));
  const openPOValue = sumBy(openPOs, (p) => p.lines.reduce((a, l) => a + l.qtyOrdered * l.unitCost, 0));
  const pendingReceipts = openPOs.length;
  const overdueInvoices = db.invoices.filter((i) => i.status === "overdue");

  const reorder = generateReorderSuggestions(scopedItems, scopedBalances, scopedMovements, db.suppliers).slice(0, 6);

  // Stock value trend: reconstruct daily totals from receipts/consumption/waste movements
  const trend = React.useMemo(() => {
    const days: { label: string; date: string; stockIn: number; stockOut: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), date: d.toISOString().slice(0, 10), stockIn: 0, stockOut: 0 });
    }
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const m of scopedMovements) {
      const row = byDate.get(m.at.slice(0, 10));
      if (!row) continue;
      row.stockIn += m.qtyIn * m.unitCost;
      row.stockOut += m.qtyOut * m.unitCost;
    }
    return days.map((d) => ({ ...d, stockIn: Math.round(d.stockIn), stockOut: Math.round(d.stockOut) }));
  }, [scopedMovements]);

  const categoryValues = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const b of scopedBalances) {
      const item = itemMap.get(b.itemId);
      if (!item) continue;
      map.set(item.categoryId, (map.get(item.categoryId) ?? 0) + b.qty * (b.avgCost || item.avgCost));
    }
    return [...map.entries()]
      .map(([id, value]) => ({ name: sel.categoryName(db, id), value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [scopedBalances, db, itemMap]);

  const recentMovements = scopedMovements.slice(0, 8);
  const openTransfers = db.transfers.filter((t) => ["pending", "approved", "dispatched"].includes(t.status) && inScope(t.fromOutletId));

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Arjun`}
        description={`${db.settings.profile.name} · ${outlet === "all" ? "All locations" : sel.outletName(db, outlet)} · live inventory, purchasing and cost health at a glance.`}
        actions={
          <>
            <DateRangeInput from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
            <Button size="sm" onClick={() => setQuick("stock-in")}>
              <Plus /> Stock in
            </Button>
            <Button size="sm" variant="outline" onClick={() => setQuick("stock-out")}>
              <PackageOpen /> Stock out
            </Button>
            <Button size="sm" variant="outline" onClick={() => setQuick("waste")}>
              <Trash2 /> Record waste
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total inventory value"
          value={formatMoneyShort(valuation.totalValue, currency)}
          hint={`${scopedItems.length} active items · ${outlet === "all" ? db.outlets.length + " locations" : sel.outletName(db, outlet)}`}
          icon={<Package />}
          delta={4.2}
        />
        <MetricCard
          label="Low stock items"
          value={lowStock.length}
          hint={`${lowStock.filter((i) => getStockStatus(scopedBalances.filter((b) => b.itemId === i.id).reduce((a, b) => a + b.qty, 0), i.minStock) === "out").length} out of stock`}
          icon={<AlertTriangle />}
          tone={lowStock.length > 0 ? "warning" : "success"}
        />
        <MetricCard
          label="Waste cost (period)"
          value={formatMoneyShort(wasteCost, currency)}
          hint={`${wasteInRange.length} waste entries · ${formatDate(range.from)} – ${formatDate(range.to)}`}
          icon={<Trash2 />}
          tone="danger"
        />
        <MetricCard
          label="Awaiting approval"
          value={pendingApprovals}
          hint={`${pendingReceipts} POs awaiting receipt · ${overdueInvoices.length} overdue bills`}
          icon={<ShoppingCart />}
          tone={pendingApprovals > 0 ? "info" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Stock movement value (30 days)</CardTitle>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-600" /> Stock in</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Stock out</span>
            </div>
          </CardHeader>
          <CardContent className="h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={54} tickFormatter={(v) => formatMoneyShort(v, currency)} />
                <RTooltip content={chartTooltip(true)} />
                <Area type="monotone" dataKey="stockIn" name="Stock in" stroke="#059669" strokeWidth={2} fill="url(#inGrad)" />
                <Area type="monotone" dataKey="stockOut" name="Stock out" stroke="#dc2626" strokeWidth={2} fill="url(#outGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Value by category</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link href="/reports">All reports <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="h-[260px] pt-2">
            {categoryValues.length === 0 ? (
              <EmptyState title="No valuation data" description="Stock value will appear once balances exist." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryValues} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84} paddingAngle={2}>
                    {categoryValues.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip content={chartTooltip(true)} />
                  <Legend formatter={(v) => <span className="text-[10px] text-muted-foreground">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="size-4 text-warning" /> Reorder suggestions
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link href="/forecasting">Forecasting <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {reorder.length === 0 ? (
              <EmptyState icon={<Package />} title="All items above minimum" description="Nothing needs reordering right now." />
            ) : (
              reorder.map((s) => {
                const item = itemMap.get(s.itemId);
                if (!item) return null;
                return (
                  <Link
                    key={s.itemId}
                    href={`/inventory/${s.itemId}`}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">{item.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {s.currentStock.toLocaleString("en-IN")} {item.baseUnit} left · ~{s.daysRemaining} days cover · lead {s.leadTimeDays}d
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={cn("block text-[11px] font-semibold", s.urgency === "critical" ? "text-red-600" : s.urgency === "high" ? "text-amber-600" : "text-muted-foreground")}>
                        {s.urgency === "critical" ? "Order today" : `Reorder by ${formatDate(s.reorderByDate)}`}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">Suggest {s.suggestedQty.toLocaleString("en-IN")} {item.baseUnit}</span>
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ScrollText className="size-4 text-primary" /> Recent stock movements
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link href="/stock-movements">Full ledger <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {recentMovements.length === 0 ? (
              <EmptyState icon={<ScrollText />} title="No movements yet" description="Record stock in/out to populate the ledger." />
            ) : (
              <div className="divide-y">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {sel.itemName(db, m.itemId)}
                        <span className="ml-2 text-[11px] font-normal text-muted-foreground">· {sel.outletName(db, m.outletId)}</span>
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {MOVEMENT_TYPE_LABELS[m.type]} · {m.refNo} · {formatDateTime(m.at)}
                      </p>
                    </div>
                    <span className={cn("shrink-0 text-[13px] font-semibold tabular-nums", m.qtyIn > 0 ? "text-emerald-600" : "text-red-600")}>
                      {m.qtyIn > 0 ? "+" : "−"}
                      {(m.qtyIn > 0 ? m.qtyIn : m.qtyOut).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <PackageOpen className="size-4 text-info" /> Open purchase orders
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link href="/purchase-orders">View all <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <p className="text-[11px] text-muted-foreground">
              {pendingReceipts} open · committed value {formatMoneyShort(openPOValue, currency)}
            </p>
            {openPOs.slice(0, 4).map((po) => (
              <Link key={po.id} href={`/purchase-orders/${po.id}`} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-accent">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{po.poNumber}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{sel.supplierName(db, po.supplierId)} · exp {formatDate(po.expectedDate)}</span>
                </span>
                <PoStatusBadge status={po.status} />
              </Link>
            ))}
            {openPOs.length === 0 ? <EmptyState title="No open orders" description="All purchase orders are closed." /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-warning" /> Expiring soon
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link href="/inventory">Inventory <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {expiringBatches.length === 0 ? (
              <EmptyState icon={<ClipboardCheck />} title="Nothing expiring" description={`No batches expire within ${db.settings.inventory.expiryAlertDays} days.`} />
            ) : (
              <div className="space-y-2">
                {expiringBatches.slice(0, 5).map((b) => {
                  const days = daysUntil(b.expiryDate);
                  return (
                    <div key={b.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium">{sel.itemName(db, b.itemId)}</span>
                        <span className="block text-[11px] text-muted-foreground">Batch {b.batchNo} · {b.qty} at {sel.outletName(db, b.outletId)}</span>
                      </span>
                      <span className={cn("shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold", days <= 2 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
                        {days <= 0 ? "Today" : `${days}d left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Receipt className="size-4 text-destructive" /> Overdue invoices
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link href="/invoices">Bills <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {overdueInvoices.length === 0 ? (
              <EmptyState icon={<Receipt />} title="No overdue bills" description="All supplier invoices are within terms." />
            ) : (
              overdueInvoices.map((inv) => (
                <Link key={inv.id} href="/invoices" className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-accent">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{inv.invoiceNumber}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{sel.supplierName(db, inv.supplierId)} · due {formatDate(inv.dueDate)}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-red-600">
                    {formatMoneyShort(inv.total - inv.paid, currency)}
                  </span>
                </Link>
              ))
            )}
            <div className="rounded-md border border-dashed bg-muted/40 p-3">
              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Pending transfers</p>
              {openTransfers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No transfers in flight.</p>
              ) : (
                openTransfers.slice(0, 3).map((t) => (
                  <Link key={t.id} href="/transfers" className="flex items-center justify-between text-[12px] hover:underline">
                    <span>{t.transferNumber} · {sel.outletName(db, t.fromOutletId)} → {sel.outletName(db, t.toOutletId)}</span>
                    <TransferStatusBadge status={t.status} />
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ChefHat className="size-4 text-violet-600" /> Recipe cost watch
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
              <Link href="/recipes">Recipes <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <RecipeCostMini />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-emerald-600" /> Stock value trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[190px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend.slice(-14)} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => formatMoneyShort(v, currency)} />
                <RTooltip content={chartTooltip(true)} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="stockOut" name="Consumed value" fill="#dc2626" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="sm" variant="outline" className="justify-start"><Link href="/purchase-orders/new"><ShoppingCart /> New PO</Link></Button>
              <Button asChild size="sm" variant="outline" className="justify-start"><Link href="/receiving"><PackageOpen /> Receive</Link></Button>
              <Button asChild size="sm" variant="outline" className="justify-start"><Link href="/stock-counts"><ClipboardCheck /> Count stock</Link></Button>
              <Button asChild size="sm" variant="outline" className="justify-start"><Link href="/waste"><Trash2 /> Waste</Link></Button>
            </div>
            <QuickLinks links={QUICK_ACTION_LINKS.slice(0, 2)} />
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-[11px] font-medium text-muted-foreground">New to the demo?</p>
              <p className="mt-1 mb-2 text-[11px] leading-relaxed text-muted-foreground">
                Run a scripted end-to-end scenario (low stock → PO → receipt) from the header button, or reset everything to the seeded dataset.
              </p>
              <DemoScenarios />
            </div>
          </CardContent>
        </Card>
      </div>

      <QuickStockDialog mode={quick ?? "stock-in"} open={quick !== null} onOpenChange={(v) => { if (!v) setQuick(null); }} />
    </div>
  );
}

function RecipeCostMini() {
  const { db } = useStore();
  const rows = db.recipes
    .filter((r) => r.active)
    .map((r) => {
      const breakdown = calculateRecipeCost(r, db.items, db.balances);
      return { id: r.id, name: r.name, pct: breakdown.foodCostPct, target: r.targetFoodCostPct, price: r.sellingPrice };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const over = r.pct > r.target;
        return (
          <Link key={r.id} href={`/recipes/${r.id}`} className="block rounded-md border px-3 py-2 transition-colors hover:bg-accent">
            <div className="flex items-center justify-between text-[13px]">
              <span className="truncate font-medium">{r.name}</span>
              <span className={cn("font-semibold tabular-nums", over ? "text-red-600" : "text-emerald-600")}>{r.pct.toFixed(1)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", over ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, r.pct)}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Target {r.target}% · Selling ₹{r.price}</p>
          </Link>
        );
      })}
    </div>
  );
}
