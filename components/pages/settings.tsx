"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { RotateCcw } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function SettingsPage() {
  const { db, update, reset } = useStore();
  const { success, info } = useToast();
  const s = db.settings;
  const [confirmReset, setConfirmReset] = React.useState(false);

  const patchProfile = (key: keyof typeof s.profile, value: string) =>
    update((d) => ({
      ...d,
      settings: { ...d.settings, profile: { ...d.settings.profile, [key]: value } },
    }));

  const patchInventory = (key: keyof typeof s.inventory, value: number | boolean | string) =>
    update((d) => ({
      ...d,
      settings: { ...d.settings, inventory: { ...d.settings.inventory, [key]: value } },
    }));

  const patchProcurement = (key: keyof typeof s.procurement, value: number | boolean | string) =>
    update((d) => ({
      ...d,
      settings: { ...d.settings, procurement: { ...d.settings.procurement, [key]: value } },
    }));

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Business profile, costing defaults and document prefixes."
        actions={
          <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-3.5" /> Reset demo data
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-4 text-sm font-semibold">Business profile</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Business name</Label>
                <Input
                  value={s.profile.name}
                  onChange={(e) => patchProfile("name", e.target.value)}
                  onBlur={() => success("Saved")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Legal name</Label>
                <Input
                  value={s.profile.legalName}
                  onChange={(e) => patchProfile("legalName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={s.profile.email}
                  onChange={(e) => patchProfile("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={s.profile.phone}
                  onChange={(e) => patchProfile("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={s.profile.address}
                  onChange={(e) => patchProfile("address", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input
                  value={s.profile.gstin}
                  onChange={(e) => patchProfile("gstin", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={s.profile.currency} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-4 text-sm font-semibold">Inventory defaults</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Default min stock</Label>
                <Input
                  type="number"
                  value={s.inventory.defaultMinStock}
                  onChange={(e) => patchInventory("defaultMinStock", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry alert days</Label>
                <Input
                  type="number"
                  value={s.inventory.expiryAlertDays}
                  onChange={(e) => patchInventory("expiryAlertDays", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Costing method</Label>
                <Input value={s.inventory.costingMethod} disabled />
              </div>
              <div className="flex items-end gap-2">
                <input
                  id="lownotif"
                  type="checkbox"
                  checked={s.inventory.lowStockNotifications}
                  onChange={(e) => patchInventory("lowStockNotifications", e.target.checked)}
                  className="size-4"
                />
                <Label htmlFor="lownotif">Low stock notifications</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-4 text-sm font-semibold">Procurement</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>PO prefix</Label>
                <Input
                  value={s.procurement.poPrefix}
                  onChange={(e) => patchProcurement("poPrefix", e.target.value)}
                  onBlur={() => info("PO prefix saved")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>GRN prefix</Label>
                <Input
                  value={s.procurement.grnPrefix}
                  onChange={(e) => patchProcurement("grnPrefix", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Default lead time (days)</Label>
                <Input
                  type="number"
                  value={s.procurement.defaultLeadTimeDays}
                  onChange={(e) =>
                    patchProcurement("defaultLeadTimeDays", Number(e.target.value))
                  }
                />
              </div>
              <div className="flex items-end gap-2">
                <input
                  id="reqapp"
                  type="checkbox"
                  checked={s.procurement.requireApproval}
                  onChange={(e) => patchProcurement("requireApproval", e.target.checked)}
                  className="size-4"
                />
                <Label htmlFor="reqapp">Require approval for new POs</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-4 text-sm font-semibold">About this demo</h3>
            <p className="text-sm text-muted-foreground">
              This build is a sample UI to demonstrate the flow. Data lives in your browser&apos;s
              localStorage only — no server, no auth, no API keys. Reset clears local changes and
              restores the seed dataset.
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="All local changes will be wiped and the seed dataset restored."
        confirmLabel="Reset"
        onConfirm={() => {
          reset();
          success("Demo data reset");
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
