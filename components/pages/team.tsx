"use client";

import { EmptyState, MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import { Users } from "lucide-react";

export function TeamPage() {
  const { db } = useStore();

  const roleCount = new Map<string, number>();
  for (const t of db.team) roleCount.set(t.role, (roleCount.get(t.role) ?? 0) + 1);

  return (
    <div>
      <PageHeader
        title="Team & Roles"
        description="Who has access, what they can do and when they were last active."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Team members"
          value={db.team.length}
          hint={`${db.team.filter((t) => t.status === "active").length} active`}
          icon={<Users className="size-4" />}
        />
        <MetricCard
          label="Invited"
          value={db.team.filter((t) => t.status === "invited").length}
          hint="Pending join"
        />
        <MetricCard label="Roles" value={roleCount.size} hint="Distinct roles in use" />
      </div>

      <Card>
        <CardContent className="px-0">
          <DataTable
            rows={db.team}
            rowKey={(t) => t.id}
            emptyState={
              <EmptyState
                icon={<Users className="size-6" />}
                title="No team members"
                description="Team members will appear here."
              />
            }
            columns={[
              {
                key: "name",
                header: "Member",
                sortValue: (t) => t.name,
                cell: (t) => (
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.email}</p>
                  </div>
                ),
              },
              { key: "role", header: "Role", cell: (t) => t.role },
              {
                key: "outlets",
                header: "Access",
                cell: (t) =>
                  t.outletIds.length === db.outlets.length
                    ? "All locations"
                    : `${t.outletIds.length} location(s)`,
              },
              {
                key: "last",
                header: "Last active",
                cell: (t) => formatDateTime(t.lastActive),
              },
              {
                key: "status",
                header: "Status",
                cell: (t) =>
                  t.status === "active" ? (
                    <StatusBadge variant="success">Active</StatusBadge>
                  ) : t.status === "invited" ? (
                    <StatusBadge variant="info">Invited</StatusBadge>
                  ) : (
                    <StatusBadge variant="slate">Inactive</StatusBadge>
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
