"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { InvoiceStatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { recordInvoicePayment } from "@/lib/ops";
import { useStore } from "@/lib/store";
import { formatDateTime, formatMoneyShort } from "@/lib/utils";
import { Receipt, IndianRupee } from "lucide-react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function InvoicesPage() {
  const { db, update, reset } = useStore();
  const { error, success } = useToast();
  const [open, setOpen] = React.useState(false);
  const [invoiceId, setInvoiceId] = React.useState("");
  const [amount, setAmount] = React.useState(0);

  const invoices = [...db.invoices].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const openInvoices = invoices.filter((i) => i.status !== "paid");
  const openValue = openInvoices.reduce((a, i) => a + i.total - i.paid, 0);
  const overdue = invoices.filter(
    (i) => i.status !== "paid" && i.dueDate < new Date().toISOString().slice(0, 10)
  );

  const openPayment = (id: string) => {
    const inv = db.invoices.find((i) => i.id === id);
    setInvoiceId(id);
    setAmount(inv ? inv.total - inv.paid : 0);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      recordInvoicePayment({ db, update, reset }, invoiceId, amount, "bank");
      success("Payment recorded", `${formatMoneyShort(amount)} paid.`);
      setOpen(false);
    } catch (err) {
      error(err instanceof Error ? err.message : "Payment failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Invoices & Bills"
        description="Supplier bills, due dates and payment status in one place."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Open bills"
          value={openInvoices.length}
          hint={`${invoices.length} total`}
          icon={<Receipt className="size-4" />}
        />
        <MetricCard
          label="Outstanding"
          value={formatMoneyShort(openValue)}
          hint="To be paid"
          icon={<IndianRupee className="size-4" />}
        />
        <MetricCard
          label="Overdue"
          value={overdue.length}
          hint="Past due date"
        />
      </div>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={invoices}
            rowKey={(i) => i.id}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={<Receipt className="size-6" />}
                title="No invoices"
                description="Supplier invoices will appear here."
              />
            }
            columns={[
              {
                key: "number",
                header: "Invoice",
                cell: (i) => (
                  <div>
                    <p className="text-sm font-medium">{i.invoiceNumber}</p>
                    <p className="text-[11px] text-muted-foreground">{i.notes}</p>
                  </div>
                ),
              },
              {
                key: "supplier",
                header: "Supplier",
                cell: (i) => db.suppliers.find((s) => s.id === i.supplierId)?.name ?? "—",
              },
              { key: "issued", header: "Issued", cell: (i) => i.invoiceDate },
              {
                key: "due",
                header: "Due",
                cell: (i) => (
                  <span
                    className={
                      i.status !== "paid" && i.dueDate < new Date().toISOString().slice(0, 10)
                        ? "text-red-600"
                        : ""
                    }
                  >
                    {i.dueDate}
                  </span>
                ),
              },
              {
                key: "total",
                header: "Total",
                align: "right",
                cell: (i) => formatMoneyShort(i.total),
              },
              {
                key: "balance",
                header: "Balance due",
                align: "right",
                cell: (i) => (
                  <span className="tabular-nums">{formatMoneyShort(i.total - i.paid)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (i) => <InvoiceStatusBadge status={i.status} />,
              },
              {
                key: "actions",
                header: "",
                cell: (i) =>
                  i.status !== "paid" ? (
                    <Button size="sm" variant="outline" onClick={() => openPayment(i.id)}>
                      Record payment
                    </Button>
                  ) : null,
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Amount (₹)</Label>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
