"use client";

import { EmptyState } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { itemStock, generateReorderSuggestions, getStockStatus } from "@/lib/calculations";
import { createInventoryItem } from "@/lib/ops";
import { loadDB, sel, useStore, type StoreApi } from "@/lib/store";
import type { InventoryItem, Unit } from "@/lib/types";
import { UNITS } from "@/lib/types";
import { downloadCsv, formatMoneyShort, formatQty } from "@/lib/utils";
import {
  Archive,
  Download,
  Pencil,
  Plus,
  Search,
  ShoppingBasket,
} from "lucide-react";
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

const EMPTY_FORM = {
  name: "",
  sku: "",
  categoryId: "",
  type: "food" as InventoryItem["type"],
  baseUnit: "kg" as Unit,
  purchaseUnit: "kg" as Unit,
  purchasePrice: 0,
  minStock: 0,
  reorderQty: 0,
  preferredSupplierId: "",
  storageLocationId: "",
  perishable: false,
  shelfLifeDays: 0,
  trackBatch: true,
};

export function InventoryItemsPage() {
  const { db, update } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const lowIds = new Set(
    generateReorderSuggestions(db.items, db.balances, db.movements, db.suppliers).map((s) => s.itemId)
  );

  const rows = db.items
    .filter((i) => (category === "all" ? true : i.categoryId === category))
    .filter((i) => (type === "all" ? true : i.type === type))
    .filter((i) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.subcategory.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const exportCsv = () => {
    downloadCsv(
      "inventory-items.csv",
      ["SKU", "Name", "Category", "Type", "Base unit", "Purchase unit", "Price", "Avg cost", "Min stock", "Status"],
      rows.map((i) => [
        i.sku,
        i.name,
        sel.categoryName(db, i.categoryId),
        i.type,
        i.baseUnit,
        i.purchaseUnit,
        i.purchasePrice,
        i.avgCost,
        i.minStock,
        i.status,
      ])
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim() || !form.categoryId) {
      toast({ title: "Missing details", description: "Name, SKU and category are required.", variant: "error" });
      return;
    }
    createInventoryItem({ db: loadDB(), update } as StoreApi, {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      barcode: "",
      description: "",
      categoryId: form.categoryId,
      subcategory: "",
      type: form.type,
      baseUnit: form.baseUnit,
      purchaseUnit: form.purchaseUnit,
      recipeUnit: form.baseUnit,
      conversion: { purchaseUnit: form.purchaseUnit, purchaseQty: 1, baseUnit: form.baseUnit, recipeUnit: form.baseUnit },
      minStock: form.minStock,
      reorderQty: form.reorderQty,
      preferredSupplierId: form.preferredSupplierId,
      purchasePrice: form.purchasePrice,
      taxPct: 5,
      storageLocationId: form.storageLocationId,
      outletIds: db.outlets.map((o) => o.id),
      perishable: form.perishable,
      shelfLifeDays: form.shelfLifeDays,
      trackBatch: form.trackBatch,
      status: "active",
    });
    toast({ title: "Item added", description: `${form.name.trim()} is ready to receive stock.`, variant: "success" });
    setOpen(false);
    setForm(EMPTY_FORM);
  };

  const archive = (item: InventoryItem) => {
    update((draft) => ({
      ...draft,
      items: draft.items.map((i) =>
        i.id === item.id ? { ...i, status: i.status === "archived" ? "active" : "archived", updatedAt: new Date().toISOString() } : i
      ),
    }));
    toast({
      title: item.status === "archived" ? "Item restored" : "Item archived",
      description: item.name,
      variant: "success",
    });
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Inventory", href: "/inventory" }, { label: "Items" }]}
        title="Ingredients & Items"
        description="Master list of everything you buy, store and cook with."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="size-3.5" /> Export
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-3.5" /> New item
            </Button>
          </>
        }
      />

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {db.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="beverage">Beverage</SelectItem>
                <SelectItem value="alcohol">Alcohol</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="supply">Supply</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setType("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(i) => i.id}
            pageSize={15}
            rowClassName={(i) => (i.status === "archived" ? "opacity-50" : "")}
            emptyState={
              <EmptyState
                icon={<ShoppingBasket className="size-6" />}
                title="No items yet"
                description="Add your first ingredient or supply to start tracking stock."
                action={
                  <Button size="sm" onClick={() => setOpen(true)}>
                    <Plus className="size-3.5" /> New item
                  </Button>
                }
              />
            }
            columns={[
              {
                key: "name",
                header: "Item",
                sortValue: (i) => i.name,
                cell: (i) => (
                  <div>
                    <Link href={`/inventory/${i.id}`} className="text-sm font-medium hover:underline">
                      {i.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {i.sku} · {i.subcategory || sel.categoryName(db, i.categoryId)}
                    </p>
                  </div>
                ),
              },
              {
                key: "type",
                header: "Type",
                cell: (i) => <span className="text-xs capitalize">{i.type}</span>,
              },
              {
                key: "units",
                header: "Units",
                sortValue: (i) => i.baseUnit,
                cell: (i) => (
                  <span className="text-xs text-muted-foreground">
                    1 {i.purchaseUnit} = {i.conversion?.purchaseQty ?? 1} {i.baseUnit}
                  </span>
                ),
              },
              {
                key: "price",
                header: "Price",
                align: "right",
                sortValue: (i) => i.purchasePrice,
                cell: (i) => (
                  <span className="text-sm tabular-nums">{formatMoneyShort(i.purchasePrice)}</span>
                ),
              },
              {
                key: "stock",
                header: "On hand",
                align: "right",
                sortValue: (i) => itemStock(db.balances, i.id),
                cell: (i) => {
                  const qty = itemStock(db.balances, i.id);
                  const st = getStockStatus(qty, i.minStock);
                  return (
                    <span
                      className={cnStock(st)}
                    >
                      {formatQty(qty, i.baseUnit)}
                    </span>
                  );
                },
              },
              {
                key: "status",
                header: "Status",
                cell: (i) =>
                  i.status === "archived" ? (
                    <StatusBadge variant="slate">Archived</StatusBadge>
                  ) : lowIds.has(i.id) ? (
                    <StatusBadge variant="warning">Reorder</StatusBadge>
                  ) : (
                    <StatusBadge variant="success">Active</StatusBadge>
                  ),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                cell: (i) => (
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Edit"
                      onClick={() => {
                        setForm({
                          name: i.name,
                          sku: i.sku,
                          categoryId: i.categoryId,
                          type: i.type,
                          baseUnit: i.baseUnit,
                          purchaseUnit: i.purchaseUnit,
                          purchasePrice: i.purchasePrice,
                          minStock: i.minStock,
                          reorderQty: i.reorderQty,
                          preferredSupplierId: i.preferredSupplierId,
                          storageLocationId: i.storageLocationId,
                          perishable: i.perishable,
                          shelfLifeDays: i.shelfLifeDays,
                          trackBatch: i.trackBatch,
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title={i.status === "archived" ? "Restore" : "Archive"}
                      onClick={() => archive(i)}
                    >
                      <Archive className="size-3.5" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New inventory item</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Basmati Rice"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. DRY-010"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {db.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as InventoryItem["type"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="alcohol">Alcohol</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="supply">Supply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Base unit (stock)</Label>
                <Select value={form.baseUnit} onValueChange={(v) => setForm({ ...form, baseUnit: v as Unit })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Purchase unit</Label>
                <Select value={form.purchaseUnit} onValueChange={(v) => setForm({ ...form, purchaseUnit: v as Unit })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Purchase price (₹ per purchase unit)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min">Minimum stock (in base unit)</Label>
                <Input
                  id="min"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reorder">Reorder quantity</Label>
                <Input
                  id="reorder"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.reorderQty}
                  onChange={(e) => setForm({ ...form, reorderQty: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred supplier</Label>
                <Select
                  value={form.preferredSupplierId}
                  onValueChange={(v) => setForm({ ...form, preferredSupplierId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {db.suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cnStock(status: "healthy" | "low" | "out") {
  return status === "out"
    ? "text-sm font-medium tabular-nums text-red-600"
    : status === "low"
      ? "text-sm font-medium tabular-nums text-amber-600"
      : "text-sm tabular-nums";
}
