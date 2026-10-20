"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import type { Supplier } from "@/lib/types";
import { formatMoneyShort, uid } from "@/lib/utils";
import { Phone, Plus, Search, Truck } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const EMPTY = {
  name: "",
  code: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  paymentTerms: "Net 15",
  leadTimeDays: 2,
  minOrderValue: 0,
  notes: "",
};

export function SuppliersPage() {
  const { db, update } = useStore();
  const { toast, error, success } = useToast();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY);

  const counts = new Map<string, number>();
  for (const po of db.purchaseOrders) {
    counts.set(po.supplierId, (counts.get(po.supplierId) ?? 0) + 1);
  }

  const rows = db.suppliers
    .filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      error("Missing details", "Name and code are required.");
      return;
    }
    const s: Supplier = {
      id: uid("sup"),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      gstin: form.gstin.trim(),
      paymentTerms: form.paymentTerms,
      leadTimeDays: form.leadTimeDays,
      categories: [],
      minOrderValue: form.minOrderValue,
      notes: form.notes.trim(),
      active: true,
      onTimePct: 100,
      avgDeliveryDays: form.leadTimeDays,
    };
    update((draft) => ({ ...draft, suppliers: [...draft.suppliers, s] }));
    success("Supplier added", s.name);
    setOpen(false);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Everyone you buy from — contacts, terms and performance at a glance."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> New supplier
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Suppliers" value={db.suppliers.length} hint={`${db.suppliers.filter((s) => s.active).length} active`} icon={<Truck className="size-4" />} />
        <MetricCard label="Purchase orders" value={db.purchaseOrders.length} hint="All time" />
        <MetricCard label="Avg on-time rate" value={`${Math.round(db.suppliers.reduce((a, s) => a + s.onTimePct, 0) / Math.max(1, db.suppliers.length))}%`} hint="Across all suppliers" />
      </div>

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search suppliers…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(s) => s.id}
            pageSize={15}
            emptyState={<EmptyState icon={<Truck className="size-6" />} title="No suppliers found" description="Add your first supplier to start raising purchase orders." />}
            columns={[
              {
                key: "name",
                header: "Supplier",
                sortValue: (s) => s.name,
                cell: (s) => (
                  <div>
                    <Link href={`/suppliers/${s.id}`} className="text-sm font-medium hover:underline">
                      {s.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{s.code} · {s.contactPerson || "—"}</p>
                  </div>
                ),
              },
              {
                key: "contact",
                header: "Contact",
                cell: (s) => (
                  <span className="text-xs text-muted-foreground">
                    {s.phone || "—"}
                    {s.email ? <><br />{s.email}</> : null}
                  </span>
                ),
              },
              {
                key: "terms",
                header: "Terms",
                sortValue: (s) => s.leadTimeDays,
                cell: (s) => <span className="text-xs">{s.paymentTerms} · {s.leadTimeDays}d lead</span>,
              },
              {
                key: "pos",
                header: "POs",
                align: "right",
                sortValue: (s) => counts.get(s.id) ?? 0,
                cell: (s) => <span className="text-sm tabular-nums">{counts.get(s.id) ?? 0}</span>,
              },
              {
                key: "ontime",
                header: "On-time",
                align: "right",
                sortValue: (s) => s.onTimePct,
                cell: (s) => (
                  <span className={`text-sm tabular-nums ${s.onTimePct >= 90 ? "text-emerald-600" : s.onTimePct >= 70 ? "text-amber-600" : "text-red-600"}`}>
                    {s.onTimePct}%
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (s) => (s.active ? <span className="text-xs text-emerald-600">● Active</span> : <span className="text-xs text-muted-foreground">● Inactive</span>),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s-name">Name</Label>
                <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Metro Cash & Carry" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-code">Code</Label>
                <Input id="s-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SUP-010" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-contact">Contact person</Label>
                <Input id="s-contact" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-phone">Phone</Label>
                <Input id="s-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-gstin">GSTIN</Label>
                <Input id="s-gstin" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="s-addr">Address</Label>
                <Input id="s-addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-terms">Payment terms</Label>
                <Input id="s-terms" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g. Net 15" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-lead">Lead time (days)</Label>
                <Input id="s-lead" type="number" min={0} value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save supplier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
