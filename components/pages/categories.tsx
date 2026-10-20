"use client";

import { EmptyState } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { itemStock } from "@/lib/calculations";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import { formatMoneyShort, sumBy, uid } from "@/lib/utils";
import { Plus, Tags } from "lucide-react";
import * as React from "react";

export function CategoriesPage() {
  const { db, update } = useStore();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");

  const rows = db.categories.map((c) => {
    const items = db.items.filter((i) => i.categoryId === c.id);
    const value = sumBy(items, (i) => itemStock(db.balances, i.id) * i.avgCost);
    return { category: c, itemCount: items.length, value };
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast({ title: "Missing details", description: "Name and code are both required.", variant: "error" });
      return;
    }
    const cat: Category = { id: uid("cat"), name: name.trim(), code: code.trim().toUpperCase(), subcategories: [] };
    update((draft) => ({ ...draft, categories: [...draft.categories, cat] }));
    toast({ title: "Category added", description: cat.name, variant: "success" });
    setOpen(false);
    setName("");
    setCode("");
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise items into the groups your kitchen and reports actually use."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> New category
          </Button>
        }
      />

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={rows}
            rowKey={(r) => r.category.id}
            pageSize={20}
            emptyState={
              <EmptyState
                icon={<Tags className="size-6" />}
                title="No categories"
                description="Create your first category to organise inventory."
              />
            }
            columns={[
              {
                key: "name",
                header: "Category",
                sortValue: (r) => r.category.name,
                cell: (r) => (
                  <div>
                    <p className="text-sm font-medium">{r.category.name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.category.code}</p>
                  </div>
                ),
              },
              {
                key: "subs",
                header: "Subcategories",
                cell: (r) =>
                  r.category.subcategories.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {r.category.subcategories.map((s) => (
                        <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  ),
              },
              {
                key: "items",
                header: "Items",
                align: "right",
                sortValue: (r) => r.itemCount,
                cell: (r) => <span className="text-sm tabular-nums">{r.itemCount}</span>,
              },
              {
                key: "value",
                header: "Stock value",
                align: "right",
                sortValue: (r) => r.value,
                cell: (r) => <span className="text-sm tabular-nums">{formatMoneyShort(r.value)}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frozen Foods" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-code">Code</Label>
              <Input id="cat-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FRZ" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
