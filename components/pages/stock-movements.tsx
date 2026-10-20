"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOVEMENT_TYPE_LABELS } from "@/lib/types";
import { sel, useStore } from "@/lib/store";
import { downloadCsv, formatDateTime, formatMoneyShort, formatQty, sumBy } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Download, ScrollText, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export function StockMovementsPage() {
  const { db } = useStore();
  const [type, setType] = React.useState("all");
  const [outlet, setOutlet] = React.useState("all");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const fn = (e: Event) => setOutlet((e as CustomEvent<string>).detail);
    window.addEventListener("stockpilot:outlet", fn);
    return () => window.removeEventListener("stockpilot:outlet", fn);
  }, []);

  const rows = db.movements
    .filter((m) => (type === "all" ? true : m.type === type))
    .filter((m) => (outlet === "all" ? true : m.outletId === outlet))
    .filter((m) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        sel.itemName(db, m.itemId).toLowerCase().includes(q) ||
        m.refNo.toLowerCase().includes(q) ||
        (m.notes ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const exportCsv = () => {
    downloadCsv(
      "stock-movements.csv",
      ["Date", "Type", "Item", "Outlet", "Qty In", "Qty Out", "Unit cost", "Balance after", "Reference", "Notes"],
      rows.map((m) => [
        m.at,
        m.type,
        sel.itemName(db, m.itemId),
        sel.outletName(db, m.outletId),
        m.qtyIn,
        m.qtyOut,
        m.unitCost,
        m.balanceAfter,
        m.refNo,
        m.notes ?? "",
      ])
    );
  };

  const totalIn = sumBy(rows, (r) => r.qtyIn);
  const totalOut = sumBy(rows, (r) => r.qtyOut);
  const inValue = sumBy(rows, (r) => r.qtyIn * r.unitCost);
  const outValue = sumBy(rows, (r) => r.qtyOut * r.unitCost);

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Every stock change ever recorded — immutable audit trail."
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-3.5" /> Export
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <MetricCard
          label="Stock in"
          value={formatMoneyShort(inValue)}
          hint={`${totalIn.toLocaleString()} units across ${rows.length} records`}
          tone="success"
          icon={<ArrowUpRight className="size-4" />}
        />
        <MetricCard
          label="Stock out"
          value={formatMoneyShort(outValue)}
          hint="Includes waste & consumption"
          tone="danger"
          icon={<ArrowDownRight className="size-4" />}
        />
        <MetricCard
          label="Net movement"
          value={formatMoneyShort(inValue - outValue)}
          hint="In value − out value"
        />
        <MetricCard
          label="Movement records"
          value={rows.length}
          hint="Full audit trail"
          icon={<ScrollText className="size-4" />}
        />
      </div>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search item, reference or notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Movement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outlet} onValueChange={setOutlet}>
              <SelectTrigger>
                <SelectValue placeholder="Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {db.outlets.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Movement ledger <span className="font-normal text-muted-foreground">({rows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(m) => m.id}
            pageSize={15}
            emptyState={
              <EmptyState
                icon={<ScrollText className="size-6" />}
                title="No movements found"
                description="Stock movements appear here as soon as you receive goods, transfer, count or record waste."
              />
            }
            columns={[
              {
                key: "date",
                header: "When",
                sortValue: (m) => m.at,
                cell: (m) => <span className="text-xs tabular-nums">{formatDateTime(m.at)}</span>,
              },
              {
                key: "type",
                header: "Type",
                sortValue: (m) => m.type,
                cell: (m) => (
                  <span
                    className={
                      "text-xs font-medium " + (m.qtyIn > 0 ? "text-emerald-600" : "text-red-600")
                    }
                  >
                    {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                  </span>
                ),
              },
              {
                key: "item",
                header: "Item",
                sortValue: (m) => sel.itemName(db, m.itemId),
                cell: (m) => (
                  <Link href={`/inventory/${m.itemId}`} className="text-sm font-medium hover:underline">
                    {sel.itemName(db, m.itemId)}
                  </Link>
                ),
              },
              {
                key: "qty",
                header: "Qty in / out",
                align: "right",
                cell: (m) => (
                  <span className="text-sm tabular-nums">
                    {m.qtyIn > 0 ? (
                      <span className="text-emerald-600">+{formatQty(m.qtyIn, sel.item(db, m.itemId)?.baseUnit)}</span>
                    ) : null}{" "}
                    {m.qtyOut > 0 ? (
                      <span className="text-red-600">−{formatQty(m.qtyOut, sel.item(db, m.itemId)?.baseUnit)}</span>
                    ) : null}
                  </span>
                ),
              },
              {
                key: "balance",
                header: "Balance after",
                align: "right",
                sortValue: (m) => m.balanceAfter,
                cell: (m) => (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatQty(m.balanceAfter, sel.item(db, m.itemId)?.baseUnit)}
                  </span>
                ),
              },
              {
                key: "ref",
                header: "Reference",
                cell: (m) => (
                  <span className="text-xs text-muted-foreground">
                    {m.refNo}
                    <br />
                    {sel.outletName(db, m.outletId)}
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
